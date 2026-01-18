import { FFTProcessor } from './domain/fft-processor.js';
import type { Complex } from './domain/types.js';

const N = 8;
const processor = new FFTProcessor(N);

// Test 1: DC Signal (All 1s)
const inputDC = new Float32Array(N).fill(1);
console.log("--- Testing DC Signal (All 1s) ---");
const snapshotDC = processor.compute(inputDC);

// Expected: Index 0 should be N (8), others 0.
const outputDC = snapshotDC.stages[snapshotDC.stages.length - 1];
printStage("Final Output (DC)", outputDC);


// Test 2: Cosine Wave (Frequency 1 = 1 cycle per N samples)
// f = 1 -> Index 1 and Index N-1 (7)
console.log("\n--- Testing Sine Wave (Freq 1) ---");
const inputSine = new Float32Array(N);
for (let i = 0; i < N; i++) {
    inputSine[i] = Math.cos(2 * Math.PI * 1 * i / N);
}
const snapshotSine = processor.compute(inputSine);
printStage("Final Output (Freq 1)", snapshotSine.stages[snapshotSine.stages.length - 1]);

// Dump bit reversal for manual check
console.log("\n--- Bit Reversal Indices ---");
console.log(snapshotSine.bitReversedIndices);

// Helper to print
function printStage(label: string, data: Complex[]) {
    console.log(`${label}:`);
    data.forEach((c, i) => {
        const mag = Math.sqrt(c.re * c.re + c.im * c.im).toFixed(2);
        console.log(`  [${i}] Re: ${c.re.toFixed(2)}, Im: ${c.im.toFixed(2)} | Mag: ${mag}`);
    });
}
