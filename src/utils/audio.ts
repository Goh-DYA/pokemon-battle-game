// Retro game sound and BGM engine using standard HTML5 Web Audio API
// Fully synthesized dynamically - zero asset dependencies

class BattleSoundEngine {
  private ctx: AudioContext | null = null;
  private masterVolume: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private isMuted: boolean = false;
  private currentVolumeVal: number = 0.5; // 0 to 1
  private isBgmPlaying: boolean = false;
  private bgmIntervalId: any = null;
  private currentStep: number = 0;

  // Retro chiptune sequencer configurations
  // Fast paced battle notes: bass progression & treble countermelodies
  private bassNotes = [
    73.42, 73.42, 87.31, 98.00,  // D2, D2, F2, G2
    73.42, 73.42, 103.83, 98.00, // D2, D2, G#2, G2
    73.42, 73.42, 87.31, 98.00,  // D2, D2, F2, G2
    110.00, 98.00, 87.31, 73.42  // A2, G2, F2, D2
  ];

  private leadNotes = [
    293.66, 0, 349.23, 392.00,      // D4, rest, F4, G4
    440.00, 0, 392.00, 349.23,      // A4, rest, G4, F4
    587.33, 587.33, 523.25, 493.88, // D5, D5, C5, B4
    440.00, 392.00, 349.23, 311.13  // A4, G4, F4, D#4
  ];

  constructor() {
    // Lazy initialisation to support auto-play rules
  }

  private init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();
      
      // Main Gain Node
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.setValueAtTime(this.isMuted ? 0 : this.currentVolumeVal, this.ctx.currentTime);
      this.masterVolume.connect(this.ctx.destination);

      // Separate SFX vs BGM gains
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.35, this.ctx.currentTime); // keep music pleasant
      this.bgmGain.connect(this.masterVolume);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.65, this.ctx.currentTime); // keep action punchy
      this.sfxGain.connect(this.masterVolume);
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  // --- Volume and Controls ---
  
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.init();
    if (this.masterVolume && this.ctx) {
      this.masterVolume.gain.setValueAtTime(this.isMuted ? 0 : this.currentVolumeVal, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMutedState(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.currentVolumeVal = Math.max(0, Math.min(1, vol));
    this.init();
    if (this.masterVolume && this.ctx) {
      this.masterVolume.gain.setValueAtTime(this.isMuted ? 0 : this.currentVolumeVal, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.currentVolumeVal;
  }

  // --- Sound Effects (SFX) ---

  // Standard Button Hover / Select sound
  public playClick() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.1);
    } catch (e) {
      // safe bypass
    }
  }

  // Switching a Pokémon in
  public playSwitch() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(900, t + 0.25);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.25);
    } catch (e) {}
  }

  // Pokémon faints sound (downward sweep)
  public playFaint() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.linearRampToValueAtTime(50, t + 0.5);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.5);
    } catch (e) {}
  }

  // Healing Chime / Potion used
  public playHeal() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const t = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.1);

        gain.gain.setValueAtTime(0.12, t + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.1 + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(t + idx * 0.1);
        osc.stop(t + idx * 0.1 + 0.25);
      });
    } catch (e) {}
  }

  // Normal / Not very effective hit sound (short brown noise surge or low saw crunch)
  public playHit(effectiveness: number = 1.0) {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();

      // Custom synth hit
      if (effectiveness > 1.0) {
        this.playSuperEffective();
        return;
      }

      const t = this.ctx.currentTime;
      const duration = effectiveness < 1.0 ? 0.15 : 0.25;
      const volume = effectiveness < 1.0 ? 0.15 : 0.25;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.setValueAtTime(60, t + 0.1);

      // Add a square wave sub for crunch
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(80, t);

      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc2.start(t);
      osc.stop(t + duration);
      osc2.stop(t + duration);
    } catch (e) {}
  }

  // Super effective hit sound (heavy explosive crunch)
  private playSuperEffective() {
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      
      // Heavy kick/explosion
      const osc = this.ctx.createOscillator();
      const oscSub = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(10, t + 0.4);

      oscSub.type = 'square';
      oscSub.frequency.setValueAtTime(90, t);
      oscSub.frequency.linearRampToValueAtTime(10, t + 0.45);

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      oscSub.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      oscSub.start(t);
      osc.stop(t + 0.45);
      oscSub.stop(t + 0.45);
    } catch (e) {}
  }

  // Standard Pokemon attack/move cast sound
  public playAttack() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(950, t + 0.18);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.18);
    } catch (e) {}
  }

  // Champion / Trainer Defeated Victory Fanfare
  public playVictoryFanfare() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const t = this.ctx.currentTime;
      // High-energy triadic champion theme melody
      // C5, G4, C5, E5, G5, F5, E5, D5, C5, G5
      const notes = [
        523.25, 392.00, 523.25, 659.25, 
        783.99, 698.46, 659.25, 587.33, 
        523.25, 783.99
      ];
      const rhythms = [0.12, 0.12, 0.12, 0.12, 0.24, 0.12, 0.12, 0.12, 0.12, 0.45];

      let runningTime = t;
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const pitchDur = rhythms[idx];

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, runningTime);

        gain.gain.setValueAtTime(0.12, runningTime);
        gain.gain.exponentialRampToValueAtTime(0.001, runningTime + pitchDur - 0.02);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(runningTime);
        osc.stop(runningTime + pitchDur);
        runningTime += pitchDur;
      });
    } catch (e) {}
  }

  // --- Background Music (BGM) Sequencer ---

  public startBgm() {
    this.init();
    if (this.isBgmPlaying) return;
    this.isBgmPlaying = true;
    
    try {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      // Step sequencer triggering chiptune battle song loop
      const stepDuration = 0.135; // 135 bpm approx
      this.currentStep = 0;

      this.bgmIntervalId = setInterval(() => {
        if (!this.ctx || this.isMuted || !this.isBgmPlaying) return;

        try {
          const t = this.ctx.currentTime;
          
          // Play Bassline Note
          const bassFreq = this.bassNotes[this.currentStep % this.bassNotes.length];
          if (bassFreq > 0) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(bassFreq, t);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(450, t);

            gain.gain.setValueAtTime(0.35, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + stepDuration - 0.01);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.bgmGain!);

            osc.start(t);
            osc.stop(t + stepDuration);
          }

          // Play melody lead note on certain steps
          const leadFreq = this.leadNotes[this.currentStep % this.leadNotes.length];
          // We can play lead less frequently or play alternate patterns
          const isOffbeat = this.currentStep % 2 !== 0;
          if (leadFreq > 0 && isOffbeat) {
            const oscLead = this.ctx.createOscillator();
            const gainLead = this.ctx.createGain();

            oscLead.type = 'sawtooth';
            oscLead.frequency.setValueAtTime(leadFreq, t);

            // Add retro pitch vibrato
            oscLead.frequency.linearRampToValueAtTime(leadFreq + 6, t + stepDuration * 0.5);
            oscLead.frequency.linearRampToValueAtTime(leadFreq - 6, t + stepDuration);

            gainLead.gain.setValueAtTime(0.06, t);
            gainLead.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 1.5);

            oscLead.connect(gainLead);
            gainLead.connect(this.bgmGain!);

            oscLead.start(t);
            oscLead.stop(t + stepDuration * 1.5);
          }

          this.currentStep = (this.currentStep + 1) % 32;
        } catch (innerErr) {}
      }, stepDuration * 1000);

    } catch (err) {
      console.warn("BGM play failed", err);
    }
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }

  public isMusicPlaying(): boolean {
    return this.isBgmPlaying;
  }
}

export const audio = new BattleSoundEngine();
