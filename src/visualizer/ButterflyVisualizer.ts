import type p5 from 'p5';
import type { FFTSnapshot } from '../domain/types.js';
import type { IVisualizer } from './IVisualizer.js';
import { type EnvelopeConfig, PRESETS } from '../domain/envelope-config.js';

export class ButterflyVisualizer implements IVisualizer {
    private width: number = 0;
    private height: number = 0;

    // Envelope State
    // nodeStates[stageIndex][fftIndex]
    private nodeStates: number[][] = [];
    private config: EnvelopeConfig = PRESETS[1]; // Default to Neon

    // Layout parameters
    private marginX = 50;
    private marginY = 50;

    setConfig(config: EnvelopeConfig): void {
        this.config = config;
    }

    setup(_p: p5, width: number, height: number): void {
        this.width = width;
        this.height = height;
        // Reset states? Or lazy init in draw?
        // Let's lazy init/resize in draw to be safe against N changes.
    }

    resize(width: number, height: number): void {
        this.width = width;
        this.height = height;
    }

    draw(p: p5, snapshot: FFTSnapshot): void {
        const stages = snapshot.stages;
        const numStages = stages.length;
        const N = snapshot.stages[0].length;

        // Initialize States if needed
        if (this.nodeStates.length !== numStages || this.nodeStates[0]?.length !== N) {
            this.nodeStates = Array.from({ length: numStages }, () => new Array(N).fill(0));
        }

        // Calculate spacing
        const stageStride = (this.width - 2 * this.marginX) / (numStages - 1);
        const nodeStride = (this.height - 2 * this.marginY) / (N - 1);

        p.background(20); // Dark background
        p.strokeWeight(1);
        p.noFill();

        // Helper to get coordinates
        const getX = (stageIndex: number) => this.marginX + stageIndex * stageStride;
        const getY = (nodeIndex: number) => this.marginY + nodeIndex * nodeStride;

        // Draw connections (Butterflies)
        // We draw lines between Stage S and Stage S+1
        // My FFT implementation details:
        // Stage 0 is the start (after bit-reversal).
        // Loop s from 0 to numStages - 2
        for (let s = 0; s < numStages - 1; s++) {
            // Reconstruct the butterfly pattern for this stage.
            // In my FFTProcessor:
            // Stage 1 (index 1 in snapshot) corresponds to butterflySize = 2.
            // Stage s+1 in snapshot corresponds to loop with butterflySize = 1 << (s+1).
            // Wait, snapshot.stages[0] is initial state.
            // snapshot.stages[1] is result of first set of butterflies (size 2).
            // So connections between stages[0] and stages[1] follow butterfly size 2.
            // Connections between stages[s] and stages[s+1] follow butterfly size = 1 << (s+1).

            const butterflySize = 1 << (s + 1);
            const halfSize = butterflySize >> 1;

            p.stroke(100, 150, 255, 100); // Faint blue lines

            for (let i = 0; i < N; i += butterflySize) {
                for (let j = 0; j < halfSize; j++) {
                    const k = i + j;          // Index of "Even"
                    const m = i + j + halfSize; // Index of "Odd"

                    const x1 = getX(s);
                    const x2 = getX(s + 1);

                    const yk = getY(k);
                    const ym = getY(m);

                    // Cross connections
                    // k -> k
                    p.line(x1, yk, x2, yk);
                    // m -> m
                    p.line(x1, ym, x2, ym);
                    // k -> m (or m -> k depending on diagram style, usually it's a cross)
                    // In Cooley-Tukey: 
                    // Next[k] = Prev[k] + W*Prev[m]
                    // Next[m] = Prev[k] - W*Prev[m]
                    // So both Next[k] and Next[m] depend on Prev[k] and Prev[m].
                    p.line(x1, yk, x2, ym);
                    p.line(x1, ym, x2, yk);
                }
            }
        }

        // Draw Nodes
        for (let s = 0; s < numStages; s++) {
            const x = getX(s);
            for (let i = 0; i < N; i++) {
                const y = getY(i);

                // 1. Calculate Target Intensity
                const complex = stages[s][i];
                const rawMag = Math.sqrt(complex.re * complex.re + complex.im * complex.im);

                // 2. ADSR Update
                let current = this.nodeStates[s][i];

                if (rawMag > current) {
                    // Attack (Lerp)
                    // attackTime 0.1 means 10% remaining difference? Or duration?
                    // User said: "this.currentValue = lerp(this.currentValue, targetValue, 1.0 - attackTime);"
                    // If attackTime is 0.0 (fast), factor is 1.0 -> Immediate.
                    // If attackTime is 0.9 (slow), factor is 0.1 -> Slow.
                    const factor = 1.0 - Math.min(0.99, this.config.attackTime);
                    current += (rawMag - current) * factor;
                } else {
                    // Decay / Release
                    const diff = current - rawMag;
                    if (diff > 0.0001) {
                        // decayFactor = (1.0 - releaseTime) * Math.pow(diff, curveShape - 1.0);
                        const shape = Math.max(0.1, this.config.curveShape);
                        const releaseBase = 1.0 - Math.min(0.999, this.config.releaseTime);

                        // Safety for pow
                        // If curveShape < 1, exponent is negative. pow(small, neg) is huge.
                        // But we want decayFactor to be subtracted.
                        // Example: diff=0.1, shape=0.5 -> exponent=-0.5. pow(0.1, -0.5) = 1/sqrt(0.1) ~= 3.16
                        // decayFactor = releaseBase * 3.16. Could be > diff!
                        // If decayFactor > diff, we overshoot and go below target. 
                        // So we must clamp decayFactor to diff.

                        let factor = Math.pow(diff, shape - 1.0);

                        // Limit factor to avoid explosion
                        if (!isFinite(factor)) factor = 0;

                        let decay = releaseBase * factor;

                        // Wait, if shape=1, pow(diff, 0)=1. decay = releaseBase. Constant decrement.
                        // It means linear falloff of VALUE.
                        // If shape=2, pow(diff, 1)=diff. decay = releaseBase * diff. Exponential falloff.

                        // Apply
                        if (decay > diff) decay = diff; // Snap to target if step is too big

                        current -= decay;
                    } else {
                        current = rawMag;
                    }
                }

                this.nodeStates[s][i] = current;

                // Visualization logic: Size = Magnitude (using Normalized/State Value)
                const size = Math.min(20, 2 + current * 5);

                // Color based on phase or just magnitude
                p.noStroke();
                // Simple color mapping: brighter for higher magnitude
                const brightness = Math.min(255, current * 50);
                p.fill(100, brightness, 255);
                p.circle(x, y, size);
            }
        }

        // Draw Labels (Stage numbers)
        p.fill(255);
        p.noStroke();
        p.textAlign(p.CENTER);
        for (let s = 0; s < numStages; s++) {
            p.text(`S${s}`, getX(s), this.height - 10);
        }
    }
}
