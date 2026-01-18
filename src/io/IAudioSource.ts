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
     * Clean up resources.
     */
    disconnect(): void;

    // Optional Playback Controls (mainly for FileAudioSource)
    play?(): void;
    pause?(): void;
    stop?(): void;
    seek?(time: number): void;
    getCurrentTime?(): number;
}
