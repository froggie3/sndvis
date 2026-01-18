import type p5 from 'p5';
import type { FFTSnapshot } from '../domain/types.js';
import type { IVisualizer } from './IVisualizer.js';
import { type EnvelopeConfig, PRESETS } from '../domain/envelope-config.js';
import type { Importable, Exportable } from '../domain/mixins.js';
import { VIZ_PRESETS, type ButterflyVisualizerConfig } from './config.js';
import type { IColorStrategy } from './strategies/IColorStrategy.js';
import { ColorStrategyFactory } from './strategies/ColorStrategyFactory.js';

export class ButterflyVisualizer implements IVisualizer, Importable<ButterflyVisualizerConfig>, Exportable<ButterflyVisualizerConfig> {
    private width: number = 0;
    private height: number = 0;

    // Envelope State
    // nodeStates[stageIndex][fftIndex]
    private nodeStates: number[][] = [];
    private envConfig: EnvelopeConfig = PRESETS[1]; // Default to Neon

    // Visualizer Config
    private config: ButterflyVisualizerConfig = { ...VIZ_PRESETS[0] };
    private colorStrategy: IColorStrategy;

    // Layout parameters
    private marginX = 50;
    private marginY = 50;

    constructor() {
        this.colorStrategy = ColorStrategyFactory.getStrategy(this.config.colorMode);
    }

    // IVisualizer config (Envelope)
    setConfig(config: EnvelopeConfig): void {
        this.envConfig = config;
    }

    // Importable Implementation
    importSettings(settings: ButterflyVisualizerConfig): void {
        this.config = { ...settings };
        this.colorStrategy = ColorStrategyFactory.getStrategy(this.config.colorMode);
    }

    // Exportable Implementation
    exportSettings(): ButterflyVisualizerConfig {
        return { ...this.config };
    }

    // Helper for interactions
    getSettings(): ButterflyVisualizerConfig {
        return this.config;
    }

    setup(_p: p5, width: number, height: number): void {
        this.width = width;
        this.height = height;
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
        for (let s = 0; s < numStages - 1; s++) {
            const butterflySize = 1 << (s + 1);
            const halfSize = butterflySize >> 1;

            p.stroke(100, 150, 255, 100); // Faint blue lines (Keep fixed for now or add to config?)

            for (let i = 0; i < N; i += butterflySize) {
                for (let j = 0; j < halfSize; j++) {
                    const k = i + j;          // Index of "Even"
                    const m = i + j + halfSize; // Index of "Odd"

                    const x1 = getX(s);
                    const x2 = getX(s + 1);
                    const yk = getY(k);
                    const ym = getY(m);

                    p.line(x1, yk, x2, ym);
                    p.line(x1, ym, x2, yk);
                }
            }
        }

        // Draw Nodes
        p.push(); // Save style state

        // Strategy Setup (e.g. Color Mode)
        this.colorStrategy.setup(p, this.config);

        const { minSize, maxSize, sizeScale } = this.config;

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
                    const factor = 1.0 - Math.min(0.99, this.envConfig.attackTime);
                    current += (rawMag - current) * factor;
                } else {
                    const diff = current - rawMag;
                    if (diff > 0.0001) {
                        const shape = Math.max(0.1, this.envConfig.curveShape);
                        const releaseBase = 1.0 - Math.min(0.999, this.envConfig.releaseTime);
                        let factor = Math.pow(diff, shape - 1.0);
                        if (!isFinite(factor)) factor = 0;
                        let decay = releaseBase * factor;
                        if (decay > diff) decay = diff;
                        current -= decay;
                    } else {
                        current = rawMag;
                    }
                }

                this.nodeStates[s][i] = current;

                // 3. Visualization
                const size = Math.min(maxSize, minSize + current * sizeScale);

                p.noStroke();

                // Color Strategy Apply
                this.colorStrategy.apply(p, {
                    complex,
                    magnitude: rawMag,
                    adsrValue: current,
                    index: i,
                    total: N,
                    stageIndex: s
                }, this.config);

                p.circle(x, y, size);
            }
        }
        p.pop(); // Restore style

        // Draw Labels
        p.fill(255);
        p.noStroke();
        p.textAlign(p.CENTER);
        for (let s = 0; s < numStages; s++) {
            p.text(`S${s}`, getX(s), this.height - 10);
        }
    }
}
