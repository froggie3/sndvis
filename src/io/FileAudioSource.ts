import type { IAudioSource, AudioSourceMetadata } from './IAudioSource.js';
import { DEFAULT_FFT_SIZE } from '../domain/constants.js';

export class FileAudioSource implements IAudioSource {
    private size: number;
    private audioContext: AudioContext | null = null;
    private audioBuffer: AudioBuffer | null = null;
    private sourceNode: AudioBufferSourceNode | null = null;
    private inputAnalyser: AnalyserNode | null = null;

    private tempBuffer: Float32Array;
    private isPlaying: boolean = false;
    private startTime: number = 0; // Context time when playback started
    private startOffset: number = 0; // Where in the buffer we started playing (seconds)

    constructor(size: number = DEFAULT_FFT_SIZE) {
        this.size = size;
        this.tempBuffer = new Float32Array(size);
    }

    async initialize(audioContext?: AudioContext): Promise<void> {
        if (!audioContext) {
            this.audioContext = new AudioContext();
        } else {
            this.audioContext = audioContext;
        }

        // Setup Analyser for data extraction (used as ring buffer)
        this.inputAnalyser = this.audioContext.createAnalyser();
        this.inputAnalyser.fftSize = Math.max(32, this.size);
        this.tempBuffer = new Float32Array(this.inputAnalyser.fftSize);
    }

    // Helper to load file
    async loadFile(file: File) {
        if (!this.audioContext) return;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const decodedBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            // Stop current if playing
            this.stop();

            this.audioBuffer = decodedBuffer;
            // Reset playback
            this.play();
        } catch (err) {
            console.error("Failed to decode audio data:", err);
            alert("Failed to load audio file. It might be corrupted or an unsupported format.");
        }
    }

    play() {
        if (!this.audioContext || !this.audioBuffer) return;
        if (this.isPlaying) return;

        this.sourceNode = this.audioContext.createBufferSource();
        this.sourceNode.buffer = this.audioBuffer;
        this.sourceNode.loop = true;

        this.sourceNode.connect(this.inputAnalyser!);
        this.inputAnalyser!.connect(this.audioContext.destination);

        // Resume from where we left off
        this.startTime = this.audioContext.currentTime;
        this.sourceNode.start(0, this.startOffset);

        this.isPlaying = true;
    }

    pause() {
        if (!this.isPlaying || !this.sourceNode) return;

        try {
            this.sourceNode.stop();
        } catch (e) { }

        // Calculate where we stopped
        const elapsed = this.audioContext!.currentTime - this.startTime;
        this.startOffset = (this.startOffset + elapsed) % this.audioBuffer!.duration;

        this.sourceNode.disconnect();
        this.sourceNode = null;
        this.isPlaying = false;
    }

    stop() {
        this.pause();
        this.startOffset = 0;
    }

    seek(time: number) {
        if (!this.audioBuffer) return;

        // Clamp time
        time = Math.max(0, Math.min(time, this.audioBuffer.duration));

        const wasPlaying = this.isPlaying;
        if (wasPlaying) {
            // Using pause() is safer as it handles disconnection and state reset
            this.pause();
        }

        this.startOffset = time;

        if (wasPlaying) {
            // Restart immediately
            this.play();
        }
    }

    getCurrentTime(): number {
        if (!this.audioContext || !this.audioBuffer) return 0;

        if (this.isPlaying) {
            const elapsed = this.audioContext.currentTime - this.startTime;
            return (this.startOffset + elapsed) % this.audioBuffer.duration;
        } else {
            return this.startOffset;
        }
    }

    getNextBuffer(): Float32Array {
        if (!this.inputAnalyser || !this.isPlaying) return new Float32Array(this.size);

        if (this.tempBuffer.length !== this.inputAnalyser.fftSize) {
            this.tempBuffer = new Float32Array(this.inputAnalyser.fftSize);
        }
        this.inputAnalyser.getFloatTimeDomainData(this.tempBuffer as any);
        return this.tempBuffer.slice(0, this.size);
    }

    /**
     * Get raw audio data at a specific time (for offline rendering).
     * @param time Time in seconds
     */
    getBufferAtTime(time: number): Float32Array {
        if (!this.audioBuffer) return new Float32Array(this.size);

        const sampleRate = this.audioBuffer.sampleRate;
        const startSample = Math.floor(time * sampleRate);

        const output = new Float32Array(this.size);

        // Handle out of bounds
        if (startSample >= this.audioBuffer.length) return output;

        // Copy channel 0 (mono for FFT)
        const channelData = this.audioBuffer.getChannelData(0);

        for (let i = 0; i < this.size; i++) {
            const idx = startSample + i;
            if (idx < channelData.length) {
                output[i] = channelData[idx];
            } else {
                output[i] = 0;
            }
        }

        return output;
    }

    resize(size: number): void {
        this.size = size;
        if (this.inputAnalyser) {
            this.inputAnalyser.fftSize = Math.max(32, size);
            this.tempBuffer = new Float32Array(this.inputAnalyser.fftSize);
        } else {
            this.tempBuffer = new Float32Array(size);
        }
    }

    getMetaInfo(): AudioSourceMetadata {
        return {
            sampleRate: this.audioContext?.sampleRate || 44100,
            duration: this.audioBuffer?.duration
        };
    }

    disconnect(): void {
        this.isPlaying = false;
        if (this.sourceNode) {
            try { this.sourceNode.stop(); } catch (e) { }
            this.sourceNode.disconnect();
        }
        this.inputAnalyser?.disconnect();
    }
}
