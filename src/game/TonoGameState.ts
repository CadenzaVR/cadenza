import Beatmap from "../beatmap/models/Beatmap";
import Note from "../beatmap/models/Note";
import TonoBeatmap from "../beatmap/models/TonoBeatmap";
import TonoNote from "../beatmap/models/TonoNote";
import InputState from "../input/InputState";
import Score from "../scoring/models/Score";
import { GAMEMODE_TONO } from "./GameModes";
import GameState, { GameStatus } from "./GameState";
import HitEvent from "./HitEvent";

const JUDGEMENT_THRESHOLD = 500;
export const TONE_VOLUME_INPUT = "toneVolume";
export const TONE_PITCH_INPUT = "tonePitch";
const enum ErrorThresholds {
  BAD = 180,
  GOOD = 120,
  EXCELLENT = 45,
}

const SCOREBIT = 0b00000001;
const enum Judgement {
  MISS = 0b00000000,
  PASS = 0b00000010,
  BAD = 0b00000001,
  GOOD = 0b00000011,
  EXCELLENT = 0b00000111,
}

export default class TonoGameState implements GameState {
  status: number;
  beatmap: TonoBeatmap;
  currentSongTime: number;
  timingOffset: number;
  score: Score;
  events: Array<HitEvent> = [];
  listeners: Map<string, Array<(newValue: any) => void>> = new Map();

  noteQueue: Array<Note> = []; //head of queue is at the end of the array

  private eventPool: Array<HitEvent> = [
    { note: null, judgement: null },
    { note: null, judgement: null },
    { note: null, judgement: null },
    { note: null, judgement: null },
    { note: null, judgement: null },
    { note: null, judgement: null },
    { note: null, judgement: null },
    { note: null, judgement: null },
  ];
  private shiftCounts = [0, 0, 0, 0, 0, 0, 0, 0];

  constructor() {
    this.status = GameStatus.MENU;
    this.beatmap = null;
    this.currentSongTime = 0;
    this.timingOffset = 50;
    this.score = {
      beatmap: null,
      gameMode: GAMEMODE_TONO,
      score: 0,
      highScore: 0,
      combo: 0,
      maxCombo: 0,
      data: [],
    };
  }
  getGameMode(): number {
    return GAMEMODE_TONO;
  }

  addChangeListener(property: string, handler: (newValue: any) => void): void {
    if (!this.listeners.has(property)) {
      this.listeners.set(property, []);
    }
    this.listeners.get(property).push(handler);
  }

  loadBeatmap(beatmap: Beatmap) {
    this.beatmap = beatmap as TonoBeatmap;
    // assume beatmap notes are sorted by time in ascending order
    for (let i = this.beatmap.notes.length - 1; i > -1; i--) {
      this.noteQueue.push(this.beatmap.notes[i]);
    }
  }

  private pushHitEvent(note: Note, judgement: number, ignoreTimeDelta = false) {
    const event = this.eventPool.pop();
    event.judgement = judgement;
    event.note = note;
    event.ignoreTimeDelta = ignoreTimeDelta;
    this.events.push(event);
  }

  private judgeHit(note: TonoNote, inputPitch: number): number {
    // TODO finalize inputPitch value
    note.pitchDiff = Math.abs((inputPitch - note.type) % 12);
    note.pitchDiff = Math.min(note.pitchDiff, 12 - note.pitchDiff);
    note.absPitchDiff = Math.abs(note.pitchDiff);
    note.totalError = note.absPitchDiff * 10 + note.absTimeDelta;

    if (note.totalError > ErrorThresholds.GOOD) {
      if (note.totalError < ErrorThresholds.BAD) {
        return Judgement.MISS;
      } else {
        return Judgement.BAD;
      }
    } else {
      if (note.totalError <= ErrorThresholds.EXCELLENT) {
        return Judgement.EXCELLENT;
      } else {
        return Judgement.GOOD;
      }
    }
  }

  private updateTimeDelta(note: Note): void {
    if (note.isActive) {
      note.timeDelta = this.currentSongTime - note.endTime - this.timingOffset;
    } else {
      note.timeDelta =
        this.currentSongTime - note.startTime - this.timingOffset;
    }
  }

  reset(): void {
    this.score.score = 0;
    this.score.combo = 0;
    this.score.accuracy = 0;
    this.score.data.length = 0;
    this.score.judgementCounts = {};
    this.shiftCounts.fill(0);

    this.noteQueue.length = 0;

    while (this.events.length > 0) {
      this.eventPool.push(this.events.pop());
    }
    for (const note of this.beatmap.notes) {
      note.isActive = false;
      delete note.pitchDiff;
    }
  }

  setStatus(status: number): void {
    this.status = status;
    for (const handler of this.listeners.get("status")) {
      handler(status);
    }
  }

  updateScore(): void {
    if (this.events.length > 0) {
      for (const event of this.events) {
        if (event.judgement === Judgement.MISS) {
          this.score.combo = 0;
          this.score.data.push(181);
        } else {
          if (event.judgement & SCOREBIT) {
            this.score.combo += 1;
            if (this.score.combo > this.score.maxCombo) {
              this.score.maxCombo = this.score.combo;
            }

            switch (event.judgement) {
              case Judgement.BAD:
                this.score.score += 1;
                break;
              case Judgement.GOOD:
                this.score.score += 2;
                break;
              case Judgement.EXCELLENT:
                this.score.score += 6;
                break;
            }

            if (this.score.score > this.score.highScore) {
              this.score.highScore = this.score.score;
            }
          }

          this.score.data.push((event.note as TonoNote).totalError);
        }
      }
      for (const handler of this.listeners.get("score")) {
        handler(this.score);
      }
    }
  }

  update(newSongTime: number, inputs: InputState): void {
    this.currentSongTime = newSongTime;
    // Latency sources:
    // 1. Song audio latency: time between song time and actual time user hears sound
    // 2. Input feedback latency: time between user input and when user feels haptic/hears audio
    // If input feedback latency is greater than song audio latency. User should trigger the input earlier to compensate.

    if (this.status === GameStatus.PLAYING) {
      while (this.events.length > 0) {
        this.eventPool.push(this.events.pop());
      }
      // handle notes at front of each queue
      let note = this.noteQueue[this.noteQueue.length - 1];

      while (note) {
        this.updateTimeDelta(note);
        if (note.timeDelta > ErrorThresholds.BAD) {
          this.pushHitEvent(note, Judgement.MISS);
          note.isActive = false;
          this.noteQueue.pop();
          note = this.noteQueue[this.noteQueue.length - 1];
        } else {
          break;
        }
      }

      if (note) {
        let tone;
        const toneActive = inputs.eventMap.get(TONE_VOLUME_INPUT);
        if (toneActive) {
          tone = inputs.stateMap.get(TONE_PITCH_INPUT).inputs[0].value;
        }
        if (tone) {
          note.absTimeDelta = Math.abs(note.timeDelta);
          if (!note.isActive && note.absTimeDelta <= JUDGEMENT_THRESHOLD) {
            this.pushHitEvent(note, this.judgeHit(note, tone));
            note.isActive = true;
            this.updateTimeDelta(note);
          }
        }
        if (note.isActive && (note.timeDelta >= 0 || toneActive === 0)) {
          this.pushHitEvent(note, Judgement.PASS);
          note.isActive = false;
          this.noteQueue.pop();
        }
      }
    }
  }
}
