

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = 0.5;
  private isMuted: boolean = false;
  private voiceCache: Map<string, AudioBuffer> = new Map();

  constructor() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.setVolume(50); // Default 50%
      }
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(100, vol)) / 100;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx?.currentTime || 0);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private createNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 0.1; // 0.1 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // 播放语音文件
  public async playVoice(filename: string) {
    if (!this.ctx || !this.masterGain) return;
    this.resume();

    // 检查缓存
    let buffer = this.voiceCache.get(filename);

    if (!buffer) {
        try {
            // 假设音频文件位于 public/audios/ 目录下
            const response = await fetch(`/audios/${filename}.mp3`);
            if (!response.ok) {
                console.warn(`Audio file not found: ${filename}`);
                return;
            }
            const arrayBuffer = await response.arrayBuffer();
            buffer = await this.ctx.decodeAudioData(arrayBuffer);
            this.voiceCache.set(filename, buffer);
        } catch (e) {
            console.error(`Failed to load voice: ${filename}`, e);
            return;
        }
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.masterGain);
    source.start();
  }

  // 麻将牌撞击声 (Click/Clack)
  public playDiscard() {
    if (!this.ctx || !this.masterGain) return;
    this.resume();
    const t = this.ctx.currentTime;

    // 1. 冲击声 (Impact) - 短促的噪音
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 1200;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(t);

    // 2. 只有一点点木头/塑料的共鸣 (Resonance)
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.3, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // 吃碰杠 (Alert/Chime)
  public playMeld() {
    if (!this.ctx || !this.masterGain) return;
    this.resume();
    const t = this.ctx.currentTime;

    // 双音
    [523.25, 659.25].forEach((freq, i) => { // C5, E5
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(0.2, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.05 + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.3);
    });
  }

  // 按钮点击 (Simple UI Click)
  public playClick() {
     if (!this.ctx || !this.masterGain) return;
     this.resume();
     const t = this.ctx.currentTime;
     
     const osc = this.ctx.createOscillator();
     osc.type = 'sine';
     osc.frequency.setValueAtTime(800, t);
     const gain = this.ctx.createGain();
     gain.gain.setValueAtTime(0.1, t);
     gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
     
     osc.connect(gain);
     gain.connect(this.masterGain);
     osc.start(t);
     osc.stop(t + 0.05);
  }

  // --- 结算音效 ---

  // 大获全胜 (Victory): 宏亮的大调琶音，持续时间较长
  public playVictory() {
    if (!this.ctx || !this.masterGain) return;
    this.resume();
    const t = this.ctx.currentTime;
    // C Major Arpeggio upwards + High C
    const freqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; 
    freqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'triangle'; // 类似铜管/弦乐
      osc.frequency.value = freq;
      const gain = this.ctx!.createGain();
      
      const startTime = t + i * 0.1;
      const duration = 2.0;
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  // 虽败犹荣 (Defeat): 小调下行，低沉，略带悲壮
  public playDefeat() {
    if (!this.ctx || !this.masterGain) return;
    this.resume();
    const t = this.ctx.currentTime;
    // A Minor Descending
    const freqs = [440.00, 392.00, 349.23, 329.63, 293.66, 220.00]; 
    freqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine'; // 类似低沉管风琴
      osc.frequency.value = freq;
      const gain = this.ctx!.createGain();
      
      const startTime = t + i * 0.3; // 慢速
      const duration = 2.5;
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  // 平分秋色 (Draw Game / Liuju): 五声音阶，空灵，无明显解决感
  public playDrawGame() {
    if (!this.ctx || !this.masterGain) return;
    this.resume();
    const t = this.ctx.currentTime;
    // Pentatonic drift
    const freqs = [329.63, 392.00, 440.00, 523.25, 392.00]; 
    freqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = this.ctx!.createGain();
      
      const startTime = t + i * 0.25;
      const duration = 3.0;
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.5); // Slow attack
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  // 避其锋芒 (Neutral / No win no loss): 简单和谐的和弦，短促
  public playNeutral() {
    if (!this.ctx || !this.masterGain) return;
    this.resume();
    const t = this.ctx.currentTime;
    // C Major Chord gentle
    [261.63, 329.63, 392.00].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = this.ctx!.createGain();
      
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 1.5);
    });
  }
}

export const audioService = new SoundManager();
