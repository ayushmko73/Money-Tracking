class AudioService {
  private ctx: AudioContext | null = null;
  private bgmOscs: (OscillatorNode | LFOType)[] = [];
  private bgmGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private isBgmPlaying = false;
  private sequenceInterval: number | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-24, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(40, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);
      this.compressor.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick() {
    this.init();
    const ctx = this.ctx;
    const compressor = this.compressor;
    if (!ctx || !compressor) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.03);
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    
    osc.connect(gain);
    gain.connect(compressor);
    
    osc.start();
    osc.stop(now + 0.03);
  }

  playPop() {
    this.init();
    const ctx = this.ctx;
    const compressor = this.compressor;
    if (!ctx || !compressor) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
    
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(gain);
    gain.connect(compressor);
    
    osc.start();
    osc.stop(now + 0.1);
  }

  playSuccess() {
    this.init();
    const ctx = this.ctx;
    const compressor = this.compressor;
    if (!ctx || !compressor) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      if (!ctx || !compressor) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      gain.gain.setValueAtTime(0.05, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.2);
      osc.connect(gain);
      gain.connect(compressor);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.2);
    });
  }

  playCoin() {
    this.init();
    const ctx = this.ctx;
    const compressor = this.compressor;
    if (!ctx || !compressor) return;
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, now); // E6
    
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(compressor);
    
    osc1.start();
    osc2.start();
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.3);
  }

  playVictory() {
    this.init();
    const ctx = this.ctx;
    const compressor = this.compressor;
    if (!ctx || !compressor) return;
    const now = ctx.currentTime;
    const chords = [261.63, 329.63, 392.00, 523.25]; // C Major Chord
    chords.forEach((freq) => {
      if (!ctx || !compressor) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(100, now);
      filter.frequency.exponentialRampToValueAtTime(2000, now + 0.5);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(compressor);
      
      osc.start(now);
      osc.stop(now + 1.5);
    });
  }

  toggleBGM() {
    this.init();
    const ctx = this.ctx;
    const compressor = this.compressor;
    if (!ctx || !compressor) return false;

    if (this.isBgmPlaying) {
      this.stopBGM();
      return false;
    }

    this.isBgmPlaying = true;
    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0, ctx.currentTime);
    this.bgmGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 4);
    this.bgmGain.connect(compressor);

    // Deep Sub Kick
    const startPulse = () => {
      const currentCtx = this.ctx;
      const currentBgmGain = this.bgmGain;
      if (!currentCtx || !currentBgmGain) return;
      const kickOsc = currentCtx.createOscillator();
      const kickGain = currentCtx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(55, currentCtx.currentTime);
      kickOsc.frequency.exponentialRampToValueAtTime(0.01, currentCtx.currentTime + 0.4);
      kickGain.gain.setValueAtTime(0.12, currentCtx.currentTime);
      kickGain.gain.exponentialRampToValueAtTime(0.001, currentCtx.currentTime + 0.4);
      kickOsc.connect(kickGain);
      kickGain.connect(currentBgmGain);
      kickOsc.start();
      kickOsc.stop(currentCtx.currentTime + 0.4);
    };

    // Warm Lo-fi Pad
    const padOsc = ctx.createOscillator();
    const padFilter = ctx.createBiquadFilter();
    padOsc.type = 'triangle';
    padOsc.frequency.setValueAtTime(130.81, ctx.currentTime); // C3
    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(400, ctx.currentTime);
    padFilter.Q.setValueAtTime(8, ctx.currentTime);
    
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
    lfoGain.gain.setValueAtTime(150, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(padFilter.frequency);
    
    padOsc.connect(padFilter);
    padFilter.connect(this.bgmGain);
    padOsc.start();
    lfo.start();
    
    // Lo-fi Ticker
    const ticker = (vol: number) => {
      const currentCtx = this.ctx;
      const currentBgmGain = this.bgmGain;
      if (!currentCtx || !currentBgmGain) return;
      const tOsc = currentCtx.createOscillator();
      const tGain = currentCtx.createGain();
      tOsc.type = 'square';
      tOsc.frequency.setValueAtTime(2000, currentCtx.currentTime);
      tGain.gain.setValueAtTime(vol, currentCtx.currentTime);
      tGain.gain.exponentialRampToValueAtTime(0.0001, currentCtx.currentTime + 0.02);
      tOsc.connect(tGain);
      tGain.connect(currentBgmGain);
      tOsc.start();
      tOsc.stop(currentCtx.currentTime + 0.02);
    };

    let step = 0;
    this.sequenceInterval = window.setInterval(() => {
      if (step % 8 === 0) startPulse();
      if (step % 4 === 2) ticker(0.005);
      if (step % 2 === 0) ticker(0.002);
      step = (step + 1) % 16;
    }, 125); // 120 BPM roughly

    this.bgmOscs.push(padOsc as any, lfo as any);
    return true;
  }

  private stopBGM() {
    if (this.sequenceInterval) clearInterval(this.sequenceInterval);
    const bgmGain = this.bgmGain;
    const ctx = this.ctx;
    if (bgmGain) {
      if (ctx) {
        bgmGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
      }
      setTimeout(() => {
        this.bgmOscs.forEach(o => { try { (o as OscillatorNode).stop(); } catch(e) {} });
        this.bgmOscs = [];
        this.bgmGain?.disconnect();
        this.bgmGain = null;
      }, 2000);
    }
    this.isBgmPlaying = false;
  }
}

type LFOType = OscillatorNode;
export const audioService = new AudioService();