class SirenService {
  private audio: HTMLAudioElement | null = null;
  private isEnabled: boolean = true;
  private isInitialized: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudio();
    }
  }

  private initAudio(): void {
    this.audio = new Audio();
    // Use a built-in notification sound as fallback
    // Users can replace /sounds/siren.mp3 with their own
    this.audio.src = '/sounds/siren.mp3';
    this.audio.preload = 'auto';
    this.audio.volume = 0.7;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    try {
      if (this.audio) {
        // Play and immediately pause to unlock audio on iOS/mobile
        this.audio.muted = true;
        await this.audio.play();
        this.audio.pause();
        this.audio.muted = false;
        this.audio.currentTime = 0;
        this.isInitialized = true;
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Audio initialization failed:', error);
      return false;
    }
  }

  async play(): Promise<void> {
    if (!this.isEnabled || !this.audio) return;

    try {
      this.audio.currentTime = 0;
      await this.audio.play();
    } catch (error) {
      console.warn('Failed to play siren:', error);
      // Try using Web Audio API as fallback
      this.playFallbackBeep();
    }
  }

  private playFallbackBeep(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      // Play a second beep
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1000;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.5, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.5);
      }, 300);
    } catch (error) {
      console.error('Fallback beep failed:', error);
    }
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  isAudioEnabled(): boolean {
    return this.isEnabled;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

export const sirenService = new SirenService();
