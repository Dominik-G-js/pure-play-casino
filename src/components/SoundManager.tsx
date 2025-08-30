export class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterVolume = 0.3;

  constructor() {
    // Initialize audio context on first user interaction
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  // Create a beep sound with specified frequency and duration
  private createBeep(frequency: number, duration: number, volume: number = this.masterVolume) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Play spinning sound (low frequency rumble)
  playSpinSound() {
    if (!this.audioContext) return;
    
    // Create a series of quick beeps to simulate mechanical spinning
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        this.createBeep(100 + Math.random() * 50, 0.1, 0.1);
      }, i * 100);
    }
  }

  // Play win sound (ascending notes)
  playWinSound() {
    if (!this.audioContext) return;
    
    const winNotes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    winNotes.forEach((note, index) => {
      setTimeout(() => {
        this.createBeep(note, 0.3, 0.4);
      }, index * 200);
    });

    // Add some sparkle sounds
    setTimeout(() => {
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          this.createBeep(1000 + Math.random() * 1000, 0.1, 0.2);
        }, i * 50);
      }
    }, 800);
  }

  // Play lose sound (descending note)
  playLoseSound() {
    if (!this.audioContext) return;
    
    this.createBeep(300, 0.5, 0.2);
    setTimeout(() => {
      this.createBeep(200, 0.5, 0.2);
    }, 250);
  }

  // Play button click sound
  playClickSound() {
    if (!this.audioContext) return;
    
    this.createBeep(800, 0.1, 0.1);
  }

  // Set master volume (0-1)
  setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }
}