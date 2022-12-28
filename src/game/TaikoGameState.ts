import Beatmap from "../beatmap/models/Beatmap";
import Note from "../beatmap/models/Note";
import InputState from "../input/InputState";
import Score from "../scoring/models/Score";
import GameState, { GameStatus } from "./GameState";
import HitEvent from "./HitEvent";

const JUDGEMENT_THRESHOLD = 500;
const LARGE_HIT_THRESHOLD = 30;
const DON = "don";
const KAT = "kat";
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

const DRUMROLLMASK = 0b1100;
const KATMASK = 0b0001;
const enum NoteTypes {
  SMALLDON = 0b0000,
  SMALLKAT = 0b0001,
  LARGEDON = 0b0010,
  LARGEKAT = 0b0011,
  SMALLDRUMROLL = 0b0100,
  LARGEDRUMROLL = 0b0110,
  SHAKER = 0b1010,
}

export default class TaikoGameState implements GameState {
  status: number;
  beatmap: Beatmap;
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
    this.timingOffset = 0;
    this.score = new Score(null, 0, 0, 0, 0, 0, []);
  }

  addChangeListener(property: string, handler: (newValue: any) => void): void {
    if (!this.listeners.has(property)) {
      this.listeners.set(property, []);
    }
    this.listeners.get(property).push(handler);
  }

  loadBeatmap(beatmap: Beatmap) {
    this.beatmap = beatmap;
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

  private judgeHit(note: Note): number {
    if (note.absTimeDelta > ErrorThresholds.GOOD) {
      if (note.absTimeDelta < ErrorThresholds.BAD) {
        return Judgement.MISS;
      } else {
        return Judgement.BAD;
      }
    } else {
      if (note.absTimeDelta <= ErrorThresholds.EXCELLENT) {
        return Judgement.EXCELLENT;
      } else {
        return Judgement.GOOD;
      }
    }
  }

  private updateTimeDelta(note: Note): void {
    if (note.isActive) {
      note.timeDelta = note.endTime
        ? this.currentSongTime - note.endTime
        : this.currentSongTime - note.startTime;
    } else {
      note.timeDelta = this.currentSongTime - note.startTime;
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
      if (
        note.type === NoteTypes.LARGEDON ||
        note.type === NoteTypes.LARGEKAT
      ) {
        delete note.activationTime;
      }
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
          this.score.data.push(event.note.timeDelta);
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

          if (!event.ignoreTimeDelta) {
            this.score.data.push(event.note.timeDelta);
          }
        }
      }
      for (const handler of this.listeners.get("score")) {
        handler(this.score);
      }
    }
  }

  update(newSongTime: number, inputs: InputState): void {
    this.currentSongTime = newSongTime + this.timingOffset;
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

      if (note) {
        this.updateTimeDelta(note);
        if (note.timeDelta > ErrorThresholds.BAD) {
          if (note.isActive) {
            note.isActive = false;
            this.pushHitEvent(note, Judgement.PASS);
          } else {
            this.pushHitEvent(note, Judgement.MISS);
          }
          this.noteQueue.pop();
          note = this.noteQueue[this.noteQueue.length - 1];
        } else if (note.isActive) {
          if (note.type & DRUMROLLMASK) {
            if (note.timeDelta > 0) {
              note.isActive = false;
              this.pushHitEvent(note, Judgement.PASS);
              this.noteQueue.pop();
              note = this.noteQueue[this.noteQueue.length - 1];
            }
          } else if (
            this.currentSongTime - note.activationTime >
            LARGE_HIT_THRESHOLD
          ) {
            note.isActive = false;
            this.pushHitEvent(note, Judgement.PASS);
            this.noteQueue.pop();
            note = this.noteQueue[this.noteQueue.length - 1];
          }
        }
      }

      const don = inputs.eventMap.get(DON);
      const kat = inputs.eventMap.get(KAT);
      if ((don || kat) && note) {
        note.absTimeDelta = Math.abs(note.timeDelta);
        if (note.isActive) {
          if (note.type & DRUMROLLMASK) {
            this.pushHitEvent(note, Judgement.EXCELLENT, true);
            //TODO handle small vs large vs shaker
          } else {
            // large don/kat
            if (note.type === NoteTypes.LARGEKAT) {
              if (don) {
                this.pushHitEvent(note, Judgement.MISS);
              } else {
                this.pushHitEvent(note, this.judgeHit(note));
              }
            } else {
              // don
              if (kat) {
                this.pushHitEvent(note, Judgement.MISS);
              } else {
                this.pushHitEvent(note, this.judgeHit(note));
              }
            }
            note.isActive = false;
            this.noteQueue.pop();
          }
        } else if (note.absTimeDelta <= JUDGEMENT_THRESHOLD) {
          if (note.type & DRUMROLLMASK) {
            this.pushHitEvent(note, Judgement.EXCELLENT);
            note.isActive = true;
            //TODO handle small vs large vs shaker
          } else {
            if (note.type & KATMASK) {
              if (don) {
                this.pushHitEvent(note, Judgement.MISS);
                this.noteQueue.pop();
              } else {
                this.pushHitEvent(note, this.judgeHit(note));
                if (note.type === NoteTypes.LARGEKAT) {
                  if ((kat & 0b11) === 0b11) {
                    // double kat hit
                    this.pushHitEvent(note, this.judgeHit(note));
                    this.noteQueue.pop();
                  } else {
                    note.isActive = true;
                    note.activationTime = this.currentSongTime;
                  }
                } else {
                  this.noteQueue.pop();
                }
              }
            } else {
              // don
              if (kat) {
                this.pushHitEvent(note, Judgement.MISS);
                this.noteQueue.pop();
              } else {
                this.pushHitEvent(note, this.judgeHit(note));
                if (note.type === NoteTypes.LARGEDON) {
                  if ((don & 0b11) === 0b11) {
                    // double don hit
                    this.pushHitEvent(note, this.judgeHit(note));
                    this.noteQueue.pop();
                  } else {
                    note.isActive = true;
                    note.activationTime = this.currentSongTime;
                  }
                } else {
                  this.noteQueue.pop();
                }
              }
            }
          }
        }
      }
    }
  }
}
