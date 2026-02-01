import type { ComplexArray, FFTSnapshot } from './types.js';

export class FFTProcessor {
    private size: number;
    private bitReversedIndices: number[];
    private reverseTable: number[]; // Optimization cache

    constructor(size: number) {
        if ((size & (size - 1)) !== 0) {
            throw new Error("FFT size must be a power of 2");
        }
        this.size = size;
        this.bitReversedIndices = new Array(size);
        this.reverseTable = new Array(size);
        this.precomputeBitReversal();
    }

    private precomputeBitReversal() {
        const levels = Math.log2(this.size);
        for (let i = 0; i < this.size; i++) {
            let rev = 0;
            let n = i;
            for (let j = 0; j < levels; j++) {
                rev = (rev << 1) | (n & 1);
                n >>= 1;
            }
            this.bitReversedIndices[i] = rev;
            this.reverseTable[i] = rev;
        }
    }

    public compute(input: Float32Array): FFTSnapshot {
        if (input.length !== this.size) {
            throw new Error(`Input size ${input.length} does not match FFT size ${this.size}`);
        }

        const stages: ComplexArray[] = [];

        // Stage 0: Bit-reverse copy from input
        let currentBuffer: ComplexArray = new Array(this.size);
        for (let i = 0; i < this.size; i++) {
            const rev = this.reverseTable[i];
            currentBuffer[i] = { re: input[rev], im: 0 };
        }

        // Deep copy for the snapshot of Stage 0
        stages.push(this.cloneComplexArray(currentBuffer));

        // Butterfly Stages
        const totalStages = Math.log2(this.size);

        for (let stage = 1; stage <= totalStages; stage++) {
            const butterflySize = 1 << stage;
            const halfSize = butterflySize >> 1;
            const nextBuffer = this.cloneComplexArray(currentBuffer);

            const theta = -2 * Math.PI / butterflySize;
            const wRe = Math.cos(theta);
            const wIm = Math.sin(theta);

            for (let i = 0; i < this.size; i += butterflySize) {
                let uRe = 1;
                let uIm = 0;

                for (let j = 0; j < halfSize; j++) {
                    const evenIdx = i + j;
                    const oddIdx = i + j + halfSize;

                    const evenVal = currentBuffer[evenIdx];
                    const oddVal = currentBuffer[oddIdx];

                    const tRe = uRe * oddVal.re - uIm * oddVal.im;
                    const tIm = uRe * oddVal.im + uIm * oddVal.re;

                    nextBuffer[evenIdx] = {
                        re: evenVal.re + tRe,
                        im: evenVal.im + tIm
                    };
                    nextBuffer[oddIdx] = {
                        re: evenVal.re - tRe,
                        im: evenVal.im - tIm
                    };

                    const newURe = uRe * wRe - uIm * wIm;
                    const newUIm = uRe * wIm + uIm * wRe;
                    uRe = newURe;
                    uIm = newUIm;
                }
            }

            // Update currentBuffer reference for next iteration
            // Since we created a new specific buffer 'nextBuffer' fully populated, we can just switch references if we weren't snapshotting
            // But we need to keep 'currentBuffer' valid if it was pushed? No, stages pushed clones or new arrays.
            // Here 'nextBuffer' is a new array.
            currentBuffer = nextBuffer;

            // Push snapshot
            stages.push(this.cloneComplexArray(nextBuffer));
        }

        return {
            inputBuffer: input,
            stages,
            bitReversedIndices: this.bitReversedIndices,
            finalStage: stages[stages.length - 1]
        };
    }

    public computeFinal(input: Float32Array): { inputBuffer: Float32Array, bitReversedIndices: number[], finalStage: ComplexArray } {
        if (input.length !== this.size) {
            throw new Error(`Input size ${input.length} does not match FFT size ${this.size}`);
        }

        // Stage 0: Bit-reverse copy from input
        // For optimization, we can just use two buffers and swap them
        let currentBuffer: ComplexArray = new Array(this.size);
        let nextBuffer: ComplexArray = new Array(this.size);

        for (let i = 0; i < this.size; i++) {
            const rev = this.reverseTable[i];
            currentBuffer[i] = { re: input[rev], im: 0 };
            // Initialize nextBuffer objects to avoid allocation in loop
            nextBuffer[i] = { re: 0, im: 0 };
        }

        // Butterfly Stages
        const totalStages = Math.log2(this.size);

        for (let stage = 1; stage <= totalStages; stage++) {
            const butterflySize = 1 << stage;
            const halfSize = butterflySize >> 1;

            const theta = -2 * Math.PI / butterflySize;
            const wRe = Math.cos(theta);
            const wIm = Math.sin(theta);

            for (let i = 0; i < this.size; i += butterflySize) {
                let uRe = 1;
                let uIm = 0;

                for (let j = 0; j < halfSize; j++) {
                    const evenIdx = i + j;
                    const oddIdx = i + j + halfSize;

                    const evenVal = currentBuffer[evenIdx];
                    const oddVal = currentBuffer[oddIdx];

                    const tRe = uRe * oddVal.re - uIm * oddVal.im;
                    const tIm = uRe * oddVal.im + uIm * oddVal.re;

                    const nextEven = nextBuffer[evenIdx];
                    const nextOdd = nextBuffer[oddIdx];

                    nextEven.re = evenVal.re + tRe;
                    nextEven.im = evenVal.im + tIm;

                    nextOdd.re = evenVal.re - tRe;
                    nextOdd.im = evenVal.im - tIm;

                    const newURe = uRe * wRe - uIm * wIm;
                    const newUIm = uRe * wIm + uIm * wRe;
                    uRe = newURe;
                    uIm = newUIm;
                }
            }

            // Swap buffers
            [currentBuffer, nextBuffer] = [nextBuffer, currentBuffer];
        }

        return {
            inputBuffer: input,
            bitReversedIndices: this.bitReversedIndices,
            finalStage: currentBuffer // currentBuffer holds the result after the last swap
        };
    }

    private cloneComplexArray(arr: ComplexArray): ComplexArray {
        return arr.map(c => ({ re: c.re, im: c.im }));
    }
}
