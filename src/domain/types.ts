
export interface Complex {
    re: number;
    im: number;
}

export type ComplexArray = Complex[];

/**
 * Snapshot of the FFT calculation process.
 * Contains the state of the data at each stage of the Cooley-Tukey algorithm.
 */
export interface FFTSnapshot {
    /** The original time-domain input data. */
    inputBuffer: Float32Array;

    /**
     * The stages of the FFT calculation.
     * stages[0] is the data after bit-reversal (start of butterflies).
     * stages[last] is the final frequency-domain data.
     */
    stages: ComplexArray[];

    /**
     * The indices used for the initial bit-reversal permutation.
     * bitReversedIndices[i] = j means the element at index i in the input
     * was moved to index j (or came from index j, depending on perspective).
     * In DIT: Input[i] -> Stage0[BitRev[i]].
     */
    bitReversedIndices: number[];
}
