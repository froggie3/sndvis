import type { IAudioSource, AudioSourceMetadata } from './IAudioSource.js';

export class FileAudioSource implements IAudioSource {
    private size: number;
    private audioContext: AudioContext | null = null;
    private audioBuffer: AudioBuffer | null = null;
    private sourceNode: AudioBufferSourceNode | null = null;
    private inputAnalyser: AnalyserNode | null = null;

    private tempBuffer: Float32Array;
    private isPlaying: boolean = false;


    // UI Elements
    private fileInput: HTMLInputElement | null = null;
    private container: HTMLElement | null = null;

    constructor(size: number = 2048) {
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

        const arrayBuffer = await file.arrayBuffer();
        this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        // Reset playback
        this.play();
    }

    play() {
        if (!this.audioContext || !this.audioBuffer) return;

        // Stop previous
        if (this.sourceNode) {
            try { this.sourceNode.stop(); } catch (e) { }
            this.sourceNode.disconnect();
        }

        this.sourceNode = this.audioContext.createBufferSource();
        this.sourceNode.buffer = this.audioBuffer;
        this.sourceNode.loop = true; // Loop for visualization convenience

        // Connect Line: Source -> Analyser -> Destination (Speaker)
        this.sourceNode.connect(this.inputAnalyser!);
        this.inputAnalyser!.connect(this.audioContext.destination);

        this.sourceNode.start(0);
        this.isPlaying = true;
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

    getMetaInfo(): AudioSourceMetadata {
        return {
            sampleRate: this.audioContext?.sampleRate || 44100,
            duration: this.audioBuffer?.duration
        };
    }

    getUIComponent(): HTMLElement | null {
        if (this.container) return this.container;

        this.container = document.createElement('div');
        this.container.style.color = 'white';
        this.container.style.padding = '10px';

        const label = document.createElement('label');
        label.innerText = "Select Audio File: ";

        this.fileInput = document.createElement('input');
        this.fileInput.type = "file";
        this.fileInput.accept = "audio/*";
        this.fileInput.addEventListener('change', (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
                this.loadFile(files[0]);
            }
        });

        this.container.appendChild(label);
        this.container.appendChild(this.fileInput);

        return this.container;
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
