import type { IAudioSource, AudioSourceMetadata } from './IAudioSource.js';

export class TestSignalSource implements IAudioSource {
    private size: number;
    private sampleRate: number;
    private phase: number = 0;
    private frequency: number = 2; // Default frequency (relative to N)
    private buffer: Float32Array;

    constructor(size: number = 64, sampleRate: number = 44100) {
        this.size = size;
        this.sampleRate = sampleRate;
        this.buffer = new Float32Array(size);
    }

    async initialize(_audioContext?: AudioContext): Promise<void> {
        // No async init needed for test signal
        return Promise.resolve();
    }

    getNextBuffer(): Float32Array {
        // Generate a sine wave that moves over time
        // We increment phase simply. 
        // Real frequency f in Hz would require: phase += 2*PI * f / sampleRate
        // Here we just want visual movement.

        // Let's say we want a wave that drifts.
        const driftSpeed = 0.1;
        this.phase += driftSpeed;

        for (let i = 0; i < this.size; i++) {
            // Signal: 
            // 1. Fundamental sine wave
            // 2. Some higher harmonic
            // 3. Modulated amplitude to make it "pulse"

            const t = i;
            // Wave 1: Frequency varies slightly
            const val1 = Math.sin(2 * Math.PI * (this.frequency) * (t / this.size) + this.phase);

            // Wave 2: Faster, lower amplitude
            const val2 = Math.sin(2 * Math.PI * (this.frequency * 3.5) * (t / this.size) - this.phase * 2) * 0.3;

            this.buffer[i] = val1 + val2;
        }

        return this.buffer;
    }

    getMetaInfo(): AudioSourceMetadata {
        return {
            sampleRate: this.sampleRate
        };
    }

    getUIComponent(): HTMLElement | null {
        const div = document.createElement('div');
        div.innerHTML = `
            <div style="padding: 10px; color: white;">
                <strong>Test Signal</strong><br>
                Simulated Sine Wave
            </div>
        `;
        return div;
    }

    disconnect(): void {
        // Nothing to clean up
    }
}
