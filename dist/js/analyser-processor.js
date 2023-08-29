class AnalyserProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.port.onmessage = (event) => {
      if (event.data.buffer) this._sharedData = event.data.buffer;
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];

    // Note that the input will be down-mixed to mono; however, if no inputs are
    // connected then zero channels will be passed in.
    if (input.length > 0) {
      const samples = input[0];
      let sum = 0;

      // Calculated the squared-sum.
      for (let i = 0; i < samples.length; ++i) sum += samples[i] * samples[i];

      // Calculate the RMS level and update the volume.
      Atomics.store(
        this._sharedData,
        0,
        Math.sqrt(sum / samples.length) * 1000
      );
    }

    return true;
  }
}

registerProcessor("analyser", AnalyserProcessor);