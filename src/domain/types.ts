
export interface Complex {
    re: number;
    im: number;
}

export type ComplexArray = Complex[];

/**
 * Base result of the FFT calculation containing input and final output.
 * Does not include intermediate stages.
 */
export interface FFTResult {
    /** The original time-domain input data. */
    inputBuffer: Float32Array;

    /**
     * The indices used for the initial bit-reversal permutation.
     */
    bitReversedIndices: number[];

    /**
     * The final frequency-domain data.
     */
    finalStage: ComplexArray;
}

/**
 * Snapshot of the FFT calculation process.
 * Contains the state of the data at each stage of the Cooley-Tukey algorithm.
 */
export interface FFTSnapshot extends FFTResult {
    /**
     * The stages of the FFT calculation.
     * stages[0] is the data after bit-reversal (start of butterflies).
     * stages[last] is the final frequency-domain data (same as finalStage).
     */
    stages: ComplexArray[];
}
