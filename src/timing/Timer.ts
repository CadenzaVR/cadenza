/**
 * Basic timer that uses an audio context's time (seconds).
 * Note: for high precision timing, the webpage using it should be cross origin isolated https://web.dev/coop-coep/
 */
export default class Timer {
  audio: AudioContext;

  /**
   * Used to calculate the time elapsed since the last start or resume
   */
  lastStartTime: number;

  /**
   * When the timer is stopped, the audio clock continues to run so we use this to accumulate the time that has elapsed.
   * To illustrate, here's a timeline where 'o' represents the offset time:
   *
   * SoooooP------RoooooP----R++++++>AudioContext Time
   */
  offset: number;

  constructor(audio: AudioContext) {
    this.audio = audio;
    this.offset = 0;
    this.lastStartTime = 0;
  }

  start(scheduledStartTime: number) {
    this.lastStartTime = scheduledStartTime;
  }

  pause() {
    this.offset += this.audio.currentTime - this.lastStartTime;
  }

  resume(scheduledResumeTime: number) {
    this.lastStartTime = scheduledResumeTime;
  }

  reset() {
    this.offset = 0;
  }

  getCurrentTime() {
    return (this.audio.currentTime - this.lastStartTime + this.offset) * 1000;
  }

  getCurrentTimeSeconds() {
    return this.audio.currentTime - this.lastStartTime + this.offset;
  }
}
