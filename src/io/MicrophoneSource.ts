import type { IAudioSource, AudioSourceMetadata } from './IAudioSource.js';

export class MicrophoneSource implements IAudioSource {
    private size: number;
    private audioContext: AudioContext | null = null;
    private stream: MediaStream | null = null;
    private sourceNode: MediaStreamAudioSourceNode | null = null;

    // Note: To match "Core Engine" architecture which pulls data, we need to buffer data written by AudioWorklet/ScriptProcessor.
    // However, since we are in the main thread for simple p5 + JS, let's use a simple circular buffer or just AnalyserNode to GET time domain data?
    // Wait, requirement says: "AnalyzerNode is NOT used... implementation of Cooley-Tukey... extract data as array".
    // BUT we need to *get* the raw samples from Mic to *feed* our FFTProcessor.
    // The standard way to get raw samples is AnalyserNode.getFloatTimeDomainData(). 
    // Even if we don't use AnalyserNode for FFT, we can use it as a buffer source.
    // Alternatively, ScriptProcessorNode/AudioWorklet.

    // Let's use AnalyserNode purely as a "Ring Buffer" to grab the latest time-domain data.
    // We will NOT use its getByteFrequencyData (FFT).

    private inputAnalyser: AnalyserNode | null = null;
    private tempBuffer: Float32Array;

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

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);

            // Use AnalyserNode just to grab raw time domain data
            this.inputAnalyser = this.audioContext.createAnalyser();
            this.inputAnalyser.fftSize = this.size * 2; // Should be larger than size to get enough samples? 
            // fftSize property represents the window size in samples that is used when performing a FFT.
            // But we just want time domain. 
            // If fftSize is 2048, frequencyBinCount is 1024.
            // getFloatTimeDomainData returns fftSize samples.
            // So if we need 'size' samples, we set fftSize = size.

            // Wait, if this.size (our FFT size) is e.g. 64 or 256.
            // AnalyserNode minimal fftSize is 32.
            this.inputAnalyser.fftSize = Math.max(32, this.size);

            this.sourceNode.connect(this.inputAnalyser);

            // Do NOT connect to destination (speakers) to avoid feedback loop!
        } catch (err) {
            console.error('Error accessing microphone:', err);
            throw err;
        }
    }

    getNextBuffer(): Float32Array {
        if (!this.inputAnalyser) return new Float32Array(this.size);

        // Grab latest time domain data
        // this.tempBuffer should be same size as inputAnalyser.fftSize? 
        // We resized `this.tempBuffer` in constructor.
        // We need to ensure we grab `this.size` amount.

        // If current tempBuffer is smaller/larger than what analyser gives?
        // AnalyserNode.getFloatTimeDomainData(array) fills the array.
        // The array size must be <= fftSize.
        // Actually the documentation says: "The array must be at least fftSize elements long? No, it fills what it can?"
        // MDN: "The Uint8Array / Float32Array to receive the time domain data. The size of the array should be at least as large as the fftSize property of the AnalyserNode."

        // So we need a buffer of size fftSize.
        if (this.tempBuffer.length !== this.inputAnalyser.fftSize) {
            this.tempBuffer = new Float32Array(this.inputAnalyser.fftSize);
        }

        this.inputAnalyser.getFloatTimeDomainData(this.tempBuffer as any);

        // We only return `this.size` samples.
        // If fftSize > this.size, we slice? Or just return the first N?
        // Usually we want the *most recent*? 
        // getFloatTimeDomainData returns the current waveform.

        return this.tempBuffer.slice(0, this.size);
    }

    getMetaInfo(): AudioSourceMetadata {
        return {
            sampleRate: this.audioContext?.sampleRate || 44100
        };
    }

    getUIComponent(): HTMLElement | null {
        // UI is handled by browser permission prompt mostly.
        // But we could show a status indicator.
        const div = document.createElement('div');
        div.innerHTML = `
            <div style="padding: 10px; color: white;">
                <strong>Microphone Input</strong><br>
                Listening...
            </div>
        `;
        return div;
    }

    disconnect(): void {
        this.stream?.getTracks().forEach(track => track.stop());
        this.sourceNode?.disconnect();
        this.inputAnalyser?.disconnect();
    }
}
