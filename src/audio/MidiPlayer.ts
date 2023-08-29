import { Midi } from "@tonejs/midi";
import { Soundfont } from "smplr";

const MUSYNG_KITE_NAMES = [
  "acoustic_grand_piano",
  "bright_acoustic_piano",
  "electric_grand_piano",
  "honkytonk_piano",
  "electric_piano_1",
  "electric_piano_2",
  "harpsichord",
  "clavinet",
  "celesta",
  "glockenspiel",
  "music_box",
  "vibraphone",
  "marimba",
  "xylophone",
  "tubular_bells",
  "dulcimer",
  "drawbar_organ",
  "percussive_organ",
  "rock_organ",
  "church_organ",
  "reed_organ",
  "accordion",
  "harmonica",
  "tango_accordion",
  "acoustic_guitar_nylon",
  "acoustic_guitar_steel",
  "electric_guitar_jazz",
  "electric_guitar_clean",
  "electric_guitar_muted",
  "overdriven_guitar",
  "distortion_guitar",
  "guitar_harmonics",
  "acoustic_bass",
  "electric_bass_finger",
  "electric_bass_pick",
  "fretless_bass",
  "slap_bass_1",
  "slap_bass_2",
  "synth_bass_1",
  "synth_bass_2",
  "violin",
  "viola",
  "cello",
  "contrabass",
  "tremolo_strings",
  "pizzicato_strings",
  "orchestral_harp",
  "timpani",
  "string_ensemble_1",
  "string_ensemble_2",
  "synth_strings_1",
  "synth_strings_2",
  "choir_aahs",
  "voice_oohs",
  "synth_choir",
  "orchestra_hit",
  "trumpet",
  "trombone",
  "tuba",
  "muted_trumpet",
  "french_horn",
  "brass_section",
  "synth_brass_1",
  "synth_brass_2",
  "soprano_sax",
  "alto_sax",
  "tenor_sax",
  "baritone_sax",
  "oboe",
  "english_horn",
  "bassoon",
  "clarinet",
  "piccolo",
  "flute",
  "recorder",
  "pan_flute",
  "blown_bottle",
  "shakuhachi",
  "whistle",
  "ocarina",
  "lead_1_square",
  "lead_2_sawtooth",
  "lead_3_calliope",
  "lead_4_chiff",
  "lead_5_charang",
  "lead_6_voice",
  "lead_7_fifths",
  "lead_8_bass__lead",
  "pad_1_new_age",
  "pad_2_warm",
  "pad_3_polysynth",
  "pad_4_choir",
  "pad_5_bowed",
  "pad_6_metallic",
  "pad_7_halo",
  "pad_8_sweep",
  "fx_1_rain",
  "fx_2_soundtrack",
  "fx_3_crystal",
  "fx_4_atmosphere",
  "fx_5_brightness",
  "fx_6_goblins",
  "fx_7_echoes",
  "fx_8_scifi",
  "sitar",
  "banjo",
  "shamisen",
  "koto",
  "kalimba",
  "bagpipe",
  "fiddle",
  "shanai",
  "tinkle_bell",
  "agogo",
  "steel_drums",
  "woodblock",
  "taiko_drum",
  "melodic_tom",
  "synth_drum",
  "reverse_cymbal",
  "guitar_fret_noise",
  "breath_noise",
  "seashore",
  "bird_tweet",
  "telephone_ring",
  "helicopter",
  "applause",
  "gunshot",
];

export default class MidiPlayer {
  midiInstruments: Map<string, Soundfont>;
  midi: Midi;
  context: AudioContext;
  isPlaying: boolean;
  currentTrackTime: number;
  previousStartTime: number;
  eventListeners: Map<string, Array<() => void>>;
  constructor(context: AudioContext) {
    this.midiInstruments = new Map();
    this.context = context;
    this.isPlaying = false;
    this.currentTrackTime = 0;
    this.previousStartTime = 0;
    this.eventListeners = new Map();
  }

  addEventListener(event: string, handler: () => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(handler);
  }

  async loadArrayBuffer(arrayBuffer: ArrayBuffer) {
    const midi = new Midi(arrayBuffer);
    await this.load(midi);
  }

  async load(midi: Midi) {
    this.stop();
    this.currentTrackTime = 0;
    this.midi = midi;
    for (const track of midi.tracks) {
      if (
        track.instrument != null &&
        !this.midiInstruments.has(track.instrument.name)
      ) {
        const instrument = await new Soundfont(this.context, {
          instrument: MUSYNG_KITE_NAMES[track.instrument.number],
        }).load;
        this.midiInstruments.set(track.instrument.name, instrument);
      }
    }
  }

  reset() {
    this.stop();
    this.currentTrackTime = 0;
  }

  stop() {
    for (const instrument of this.midiInstruments.values()) {
      instrument.stop();
    }
  }

  async play() {
    const startPromise = new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
    this.previousStartTime = this.context.currentTime + 0.5;
    for (const track of this.midi.tracks) {
      const instrument = this.midiInstruments.get(track.instrument.name);
      if (!instrument) {
        console.log(track.instrument.name + " not found");
        console.log(track.instrument);
        continue;
      }
      for (let i = 0; i < track.notes.length; i++) {
        const note = track.notes[i];
        const noteEnd = note.time + note.duration;
        if (noteEnd < this.currentTrackTime) {
          continue;
        }
        const noteToPlay = {
          note: note.name,
          time: this.previousStartTime + note.time - this.currentTrackTime,
          duration: Math.min(note.duration, noteEnd - this.currentTrackTime),
        } as any;
        if (i === track.notes.length - 1) {
          noteToPlay.onEnded = () => {
            for (const eventListener of this.eventListeners.get("ended")) {
              eventListener();
            }
          };
        }
        instrument.start(noteToPlay);
      }
    }
    await startPromise;
    return this.previousStartTime;
  }

  pause() {
    this.currentTrackTime += this.context.currentTime - this.previousStartTime;
    this.stop();
    return;
  }

  async resume() {
    return this.play();
  }
}
