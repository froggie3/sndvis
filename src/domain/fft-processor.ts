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
        const currentBuffer: ComplexArray = new Array(this.size);
        for (let i = 0; i < this.size; i++) {
            const rev = this.reverseTable[i];
            currentBuffer[i] = { re: input[rev], im: 0 };
        }

        // Deep copy for the snapshot of Stage 0
        stages.push(this.cloneComplexArray(currentBuffer));

        // Butterfly Stages
        const totalStages = Math.log2(this.size);

        // N is the logic size, initially 2, then 4, 8...
        for (let stage = 1; stage <= totalStages; stage++) {
            const butterflySize = 1 << stage; // 2, 4, 8...
            const halfSize = butterflySize >> 1; // 1, 2, 4...

            // Calculate W for this stage
            // W_N^k = exp(-j * 2 * pi * k / N)
            // Here, we iterate k somewhat differently in standard Cooley-Tukey loops

            // We can reuse the 'currentBuffer' for in-place styled calculation, 
            // but since we need snapshots, we might want to create a new buffer for each stage 
            // OR mutate currentBuffer and push a clone. 
            // To be safe and immutable-ish for the snapshot, let's create a next buffer.

            const nextBuffer = this.cloneComplexArray(currentBuffer);

            // W_N = exp(-j * 2pi / N)
            // theta = -2 * PI / butterflySize
            const theta = -2 * Math.PI / butterflySize;
            const wRe = Math.cos(theta);
            const wIm = Math.sin(theta);

            // Loop through each group of butterflies
            for (let i = 0; i < this.size; i += butterflySize) {
                let uRe = 1;
                let uIm = 0;

                // Loop through butterflies in the group
                for (let j = 0; j < halfSize; j++) {
                    const evenIdx = i + j;
                    const oddIdx = i + j + halfSize;

                    // Data from previous stage
                    const evenVal = currentBuffer[evenIdx];
                    const oddVal = currentBuffer[oddIdx];

                    // Butterfly Operation:
                    // Top = Even + W * Odd
                    // Bot = Even - W * Odd

                    // W * Odd
                    const tRe = uRe * oddVal.re - uIm * oddVal.im;
                    const tIm = uRe * oddVal.im + uIm * oddVal.re;

                    // Set Next Buffer
                    nextBuffer[evenIdx] = {
                        re: evenVal.re + tRe,
                        im: evenVal.im + tIm
                    };
                    nextBuffer[oddIdx] = {
                        re: evenVal.re - tRe,
                        im: evenVal.im - tIm
                    };

                    // Update W (u) -> u * W_N
                    const newURe = uRe * wRe - uIm * wIm;
                    const newUIm = uRe * wIm + uIm * wRe;
                    uRe = newURe;
                    uIm = newUIm;
                }
            }

            // Update currentBuffer reference for next iteration
            // (Wait, we need to replace all elements of currentBuffer if we want to use it again? 
            //  Actually we just made nextBuffer the new state.)
            for (let k = 0; k < this.size; k++) {
                currentBuffer[k] = nextBuffer[k];
            }

            // Push snapshot
            stages.push(this.cloneComplexArray(nextBuffer));
        }

        return {
            inputBuffer: input, // Be careful, reference. Usually fine.
            stages,
            bitReversedIndices: this.bitReversedIndices
        };
    }

    private cloneComplexArray(arr: ComplexArray): ComplexArray {
        return arr.map(c => ({ re: c.re, im: c.im }));
    }
}
