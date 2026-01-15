class AudioService {
  private ctx: AudioContext | null = null;
  private bgmOscs: (OscillatorNode | GainNode | BiquadFilterNode)[] = [];
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
      const currentCtx = this.ctx;
      const currentCompressor = this.compressor;
      if (!currentCtx || !currentCompressor) return;
      const osc = currentCtx.createOscillator();
      const gain = currentCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      gain.gain.setValueAtTime(0.05, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.2);
      osc.connect(gain);
      gain.connect(currentCompressor);
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
      const currentCtx = this.ctx;
      const currentCompressor = this.compressor;
      if (!currentCtx || !currentCompressor) return;
      const osc = currentCtx.createOscillator();
      const gain = currentCtx.createGain();
      const filter = currentCtx.createBiquadFilter();
      
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
      gain.connect(currentCompressor);
      
      osc.start(now);
      osc.stop(now + 1.5);
    });
  }

  toggleBGM(forceStart: boolean = false) {
    this.init();
    const ctx = this.ctx;
    const compressor = this.compressor;
    if (!ctx || !compressor) return false;

    if (this.isBgmPlaying && !forceStart) {
      this.stopBGM();
      return false;
    }
    
    if (this.isBgmPlaying && forceStart) {
      return true; // Already playing
    }

    this.isBgmPlaying = true;
    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0, ctx.currentTime);
    this.bgmGain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 3);
    this.bgmGain.connect(compressor);

    // 1. ZEN BREATH PAD
    const pad1 = ctx.createOscillator();
    const pad2 = ctx.createOscillator();
    const padFilter = ctx.createBiquadFilter();
    const padGain = ctx.createGain();

    pad1.type = 'sine';
    pad1.frequency.setValueAtTime(130.81, ctx.currentTime); // C3
    pad2.type = 'sine';
    pad2.frequency.setValueAtTime(131.2, ctx.currentTime); // Detuned C3

    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(300, ctx.currentTime);
    padFilter.Q.setValueAtTime(1, ctx.currentTime);

    const padLFO = ctx.createOscillator();
    const padLFOGain = ctx.createGain();
    padLFO.frequency.setValueAtTime(0.1, ctx.currentTime); 
    padLFOGain.gain.setValueAtTime(100, ctx.currentTime);
    padLFO.connect(padLFOGain);
    padLFOGain.connect(padFilter.frequency);

    padGain.gain.setValueAtTime(0.15, ctx.currentTime);

    pad1.connect(padFilter);
    pad2.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(this.bgmGain);

    pad1.start();
    pad2.start();
    padLFO.start();

    // 2. ZEN SUB PULSE
    const startPulse = () => {
      if (!this.ctx || !this.bgmGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(65.41, this.ctx.currentTime); // C2
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.5);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2.5);
      osc.connect(gain);
      gain.connect(this.bgmGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 3);
    };

    // 3. ETHEREAL SPARKLES
    const playSparkle = () => {
      if (!this.ctx || !this.bgmGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const freqs = [1046.50, 1174.66, 1318.51, 1567.98, 1760.00]; 
      const freq = freqs[Math.floor(Math.random() * freqs.length)];
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.015, this.ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.5);
      
      osc.connect(gain);
      gain.connect(this.bgmGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.5);
    };

    let tick = 0;
    this.sequenceInterval = window.setInterval(() => {
      if (tick % 16 === 0) startPulse();
      if (Math.random() > 0.8) playSparkle(); 
      tick = (tick + 1) % 64;
    }, 500);

    this.bgmOscs.push(pad1, pad2, padLFO, padFilter as any, padGain);
    return true;
  }

  private stopBGM() {
    if (this.sequenceInterval) clearInterval(this.sequenceInterval);
    const bgmGain = this.bgmGain;
    const ctx = this.ctx;
    if (bgmGain) {
      if (ctx) {
        bgmGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);
      }
      setTimeout(() => {
        this.bgmOscs.forEach(o => { 
          try { (o as any).stop?.(); } catch(e) {} 
          try { (o as any).disconnect?.(); } catch(e) {}
        });
        this.bgmOscs = [];
        this.bgmGain?.disconnect();
        this.bgmGain = null;
      }, 3000);
    }
    this.isBgmPlaying = false;
  }
}

export const audioService = new AudioService();