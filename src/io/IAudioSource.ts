export interface AudioSourceMetadata {
    sampleRate: number;
    duration?: number; // Optional for infinite streams like Mic/Oscillator
}

export interface IAudioSource {
    /**
     * Initialize the audio source.
     * @param audioContext The AudioContext to use (if applicable)
     */
    initialize(audioContext?: AudioContext): Promise<void>;

    /**
     * Get the next buffer of time-domain audio data.
     * The size of the buffer is determined by the implementation (usually matches FFT size).
     */
    getNextBuffer(): Float32Array;

    /**
     * Get metadata about the audio source.
     */
    getMetaInfo(): AudioSourceMetadata;

    /**
     * Get a DOM element for controlling this source (e.g. Play/Pause, Selection).
     * Returns null if no UI is needed.
     */
    getUIComponent(): HTMLElement | null;

    /**
     * Clean up resources.
     */
    disconnect(): void;
}
