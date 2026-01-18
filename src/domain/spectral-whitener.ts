export class SpectralWhitener {
    private amount: number = 0; // 0.0 to 1.0
    // bufferSize info might be useful later for state management, 
    // but currently we process block-by-block based on input length.
    private lastSample: number = 0;

    constructor(_bufferSize: number) {
    }

    /**
     * Set the amount of tilt correction.
     * @param amount 0.0 (flat) to 1.0 (+6dB/oct pre-emphasis)
     */
    setAmount(amount: number) {
        this.amount = Math.max(0, Math.min(1, amount));
    }

    /**
     * Apply spectral whitening to the input buffer.
     * Returns a NEW buffer to avoid mutating the source data if reused elsewhere.
     */
    whitening(input: Float32Array): Float32Array {
        const output = new Float32Array(input.length);
        const coeff = 0.95 * this.amount; // Maximum coeff close to 1.0

        // Reset history if discontinuous? 
        // For visualization smoothness, we can check if input is continuous or just ignore boundary.
        // Let's assume continuous stream logic.

        let prev = this.lastSample;

        for (let i = 0; i < input.length; i++) {
            const x = input[i];
            // Pre-emphasis filter: y[n] = x[n] - a * x[n-1]
            // This acts as a high-pass filter. 
            // If a ~= 0.95, it boosts highs relative to lows significantly.

            // To blend between "Flat" and "Whitened", we interpolate?
            // Actually, varying 'a' (coeff) changes the cutoff frequency and slope effect.
            // coeff=0 -> y=x (Flat)
            // coeff=0.9 -> High Pass
            output[i] = x - coeff * prev;
            prev = x;
        }

        this.lastSample = prev;

        // Optional: Gain Compensation
        // High-pass filtering reduces total energy of low freq signals. 
        // We might want to boost the overall gain to keep "visual loudness" consistent.
        // Simple heuristic: Boost by factor related to amount?
        // Or leave it to the visualizer's auto-gain if implemented.
        // For now, raw result is fine, user can turn up volume/gain if needed, or we add gain.

        return output;
    }

    /**
     * Call this when source changes to reset filter state
     */
    reset() {
        this.lastSample = 0;
    }
}
