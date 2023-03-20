import Beatmap from "../beatmap/models/Beatmap";
import ClassicNote from "../beatmap/models/ClassicNote";
import InputState from "../input/InputState";
import Score from "../scoring/models/Score";
import { GAMEMODE_CLASSIC } from "./GameModes";
import GameState, { GameStatus } from "./GameState";
import HitEvent from "./HitEvent";

const JUDGEMENT_THRESHOLD = 500;
const KEY_INPUT_STATES = [
  "key0",
  "key1",
  "key2",
  "key3",
  "key4",
  "key5",
  "key6",
  "key7",
];

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

const enum NoteTypes {
  HIT_NOTE = 0,
  SLIDE_NOTE = 1,
  HOLD_NOTE = 2,
  ROLL_NOTE = 3,
}

export default class ClassicGameState implements GameState {
  status: number;
  beatmap: Beatmap;
  currentSongTime: number;
  timingOffset: number;
  score: Score;
  events: Array<HitEvent> = [];
  listeners: Map<string, Array<(newValue: any) => void>> = new Map();

  noteQueues: Array<Array<ClassicNote>> = [[], [], [], [], [], [], [], []];

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
  private processedNotes = new Set<ClassicNote>();
  private toRemoveAtEndOfUpdate = [] as ClassicNote[];

  constructor() {
    this.status = GameStatus.MENU;
    this.beatmap = null;
    this.currentSongTime = 0;
    this.timingOffset = 0;
    this.score = {
      beatmap: null,
      gameMode: GAMEMODE_CLASSIC,
      score: 0,
      highScore: 0,
      combo: 0,
      maxCombo: 0,
      accuracy: 0,
      judgementCounts: null,
      data: [],
    };
  }

  getGameMode(): number {
    return GAMEMODE_CLASSIC;
  }

  addChangeListener(property: string, handler: (newValue: any) => void): void {
    if (!this.listeners.has(property)) {
      this.listeners.set(property, []);
    }
    this.listeners.get(property).push(handler);
  }

  loadBeatmap(beatmap: Beatmap) {
    this.beatmap = beatmap;
    this.score.beatmap = beatmap;
    for (const note of <ClassicNote[]>this.beatmap.notes) {
      for (let i = 0; i < note.width; i++) {
        this.noteQueues[i + note.key].push(note);
      }
    }
  }

  private pushHitEvent(
    note: ClassicNote,
    judgement: number,
    ignoreTimeDelta = false
  ) {
    const event = this.eventPool.pop();
    event.judgement = judgement;
    event.note = note;
    event.ignoreTimeDelta = ignoreTimeDelta;
    this.events.push(event);
  }

  private removeLeadingNote(note: ClassicNote) {
    this.noteQueues[note.key].shift();
    let noteQueue;
    for (let i = 1; i < note.width; i++) {
      noteQueue = this.noteQueues[note.key + i];
      noteQueue.splice(noteQueue.indexOf(note), 1);
    }
  }

  private judgeHit(note: ClassicNote): number {
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

  private updateTimeDelta(note: ClassicNote): void {
    if (note.isActive) {
      note.timeDelta = this.currentSongTime - note.endTime;
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
    this.processedNotes.clear();
    this.shiftCounts.fill(0);
    for (const noteQueue of this.noteQueues) {
      noteQueue.length = 0;
    }
    while (this.events.length > 0) {
      this.eventPool.push(this.events.pop());
    }
    for (const note of this.beatmap.notes) {
      note.isActive = false;
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

          if (event.note.type === NoteTypes.SLIDE_NOTE) {
            this.score.data.push(0);
          } else if (!event.ignoreTimeDelta) {
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
      this.processedNotes.clear();
      this.shiftCounts.fill(0);

      while (this.events.length > 0) {
        this.eventPool.push(this.events.pop());
      }
      // handle notes at front of each queue
      let key;
      let i;
      let j;
      let noteQueue;
      let note;
      let isKeyHit;
      for (key = 0; key < this.noteQueues.length; key++) {
        noteQueue = this.noteQueues[key];

        // Notes with width are placed in all queues the notes cover
        // So note at front of queue may not actually be the frontmost note.
        // It may include the frontmost note of a previous queue.
        // We skip through the queue until we find the frontmost note.
        for (i = 0; i < noteQueue.length; i++) {
          note = noteQueue[i];
          if (!this.processedNotes.has(note)) {
            this.processedNotes.add(note);
            this.updateTimeDelta(note);
            if (note.timeDelta > ErrorThresholds.BAD) {
              this.pushHitEvent(note, Judgement.MISS);
              for (j = 0; j < note.width; j++) {
                this.shiftCounts[key + j] += 1;
              }
            } else if (note.timeDelta > 0) {
              if (note.type === NoteTypes.ROLL_NOTE && note.isActive) {
                note.isActive = false;
                this.pushHitEvent(note, Judgement.PASS);
                for (j = 0; j < note.width; j++) {
                  this.shiftCounts[key + j] += 1;
                }
              } else if (
                note.type === NoteTypes.SLIDE_NOTE &&
                inputs.stateMap.get(KEY_INPUT_STATES[key]).value
              ) {
                this.pushHitEvent(note, Judgement.EXCELLENT);
                this.toRemoveAtEndOfUpdate.push(note);
              }
            }
            break;
          }
        }
      }

      for (key = 0; key < this.shiftCounts.length; key++) {
        noteQueue = this.noteQueues[key];
        for (i = 0; i < this.shiftCounts[key]; i++) {
          noteQueue.shift();
        }
        if (noteQueue.length > 0 && !this.processedNotes.has(noteQueue[0])) {
          this.updateTimeDelta(noteQueue[0]);
        }
      }

      // handle inputs
      for (key = 0; key < KEY_INPUT_STATES.length; key++) {
        if (inputs.eventMap.has(KEY_INPUT_STATES[key])) {
          isKeyHit = inputs.eventMap.get(KEY_INPUT_STATES[key]);
          note = this.noteQueues[key][0];
          if (note) {
            note.absTimeDelta = Math.abs(note.timeDelta);
            if (note.isActive) {
              if (note.type === NoteTypes.HOLD_NOTE) {
                if (!isKeyHit) {
                  // key release
                  note.isActive = false;
                  this.pushHitEvent(note, this.judgeHit(note));
                  this.removeLeadingNote(note);
                }
              } else if (note.type === NoteTypes.ROLL_NOTE) {
                // roll note
                if (isKeyHit) {
                  this.pushHitEvent(note, Judgement.EXCELLENT, true);
                }
              }
            } else if (note.absTimeDelta <= JUDGEMENT_THRESHOLD) {
              switch (note.type) {
                case NoteTypes.HIT_NOTE:
                  if (isKeyHit) {
                    this.pushHitEvent(note, this.judgeHit(note));
                    this.removeLeadingNote(note);
                  }
                  break;
                case NoteTypes.HOLD_NOTE:
                case NoteTypes.ROLL_NOTE:
                  if (isKeyHit) {
                    j = this.judgeHit(note);
                    this.pushHitEvent(note, j);
                    if (j === Judgement.MISS) {
                      this.removeLeadingNote(note);
                    } else {
                      note.isActive = true;
                    }
                  }
                  break;
              }
            }
          }
        }
      }

      while (this.toRemoveAtEndOfUpdate.length > 0) {
        this.removeLeadingNote(this.toRemoveAtEndOfUpdate.pop());
      }
    }
  }
}
