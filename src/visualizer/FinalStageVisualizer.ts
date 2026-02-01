import { calculateTransferFunction } from '../domain/transfer-function.js';
import type p5 from 'p5';
import type { FFTResult } from '../domain/types.js';
import type { IVisualizer, VisualizerRequirements } from './IVisualizer.js';
import type { Importable, Exportable } from '../domain/mixins.js';
import { FINAL_STAGE_PRESETS, type FinalStageVisualizerConfig } from './config.js';
import { ColorStrategyFactory } from './strategies/ColorStrategyFactory.js';
import type { IColorStrategy } from './strategies/IColorStrategy.js';
import { type EnvelopeConfig, PRESETS } from '../domain/envelope-config.js';

export class FinalStageVisualizer implements IVisualizer, Importable<FinalStageVisualizerConfig>, Exportable<FinalStageVisualizerConfig> {
    private width: number = 0;
    private height: number = 0;
    private config: FinalStageVisualizerConfig = { ...FINAL_STAGE_PRESETS[0] };

    public get requirements(): VisualizerRequirements {
        return { needsHistory: false };
    }

    // Strategies
    private colorStrategy: IColorStrategy;
    private envConfig: EnvelopeConfig = { ...PRESETS[1] }; // Default to Neon

    // State
    private nodeStatesReal: number[] = [];
    private nodeStatesImag: number[] = [];

    // Constants
    private readonly NYQUIST = 22050;

    constructor() {
        this.colorStrategy = ColorStrategyFactory.getStrategy(this.config.colorMode);
    }

    setup(_p: p5, width: number, height: number): void {
        this.width = width;
        this.height = height;
    }

    resize(width: number, height: number): void {
        this.width = width;
        this.height = height;
    }

    // Config for Visualizer specific settings
    setConfig(config: any): void {
        // If it looks like EnvelopeConfig, apply it
        if ('attackTime' in config && 'releaseTime' in config) {
            this.envConfig = { ...this.envConfig, ...config };
        }
    }

    // Mixins
    importSettings(settings: FinalStageVisualizerConfig): void {
        this.config = { ...settings };
        this.colorStrategy = ColorStrategyFactory.getStrategy(this.config.colorMode);
    }

    exportSettings(): FinalStageVisualizerConfig {
        return { ...this.config };
    }

    getSettings(): FinalStageVisualizerConfig {
        return this.config;
    }

    draw(p: p5, data: FFTResult): void {
        const finalStage = data.finalStage;
        const N = finalStage.length;
        const { showMode, scaleMode, minSize, maxSize, sizeScale, customExponent, gridBaseFreq } = this.config;

        const stageIndex = Math.log2(N); // Or explicitly pass if available, but N determines it.


        // Resize state arrays
        if (this.nodeStatesReal.length !== N) {
            this.nodeStatesReal = new Array(N).fill(0);
            this.nodeStatesImag = new Array(N).fill(0);
        }

        p.colorMode(p.HSL, 360, 100, 100);
        const { h: bgH, s: bgS, l: bgL } = this.config.backgroundColor;
        p.background(bgH, bgS, bgL);
        p.noStroke();

        // 1. Calculate Geometry Helpers
        const minF = gridBaseFreq || 20;
        const maxF = this.NYQUIST;

        // Helper: Frequency to X
        const getXforFreq = (f: number): number => {
            if (f < 1) f = 1;
            let t = 0;
            switch (scaleMode) {
                case 'LINEAR':
                    // 0 to MaxF
                    t = f / maxF;
                    break;
                case 'LOG':
                    // minF to MaxF
                    if (f < minF) return -100; // Out of view
                    t = (Math.log(f) - Math.log(minF)) / (Math.log(maxF) - Math.log(minF));
                    break;
                case 'MEL':
                    // Mel(f)
                    const mVal = 2595 * Math.log10(1 + f / 700);
                    const mMax = 2595 * Math.log10(1 + maxF / 700);
                    // normalize assuming minF mel is start? or just 0?
                    // Usually Mel scale starts at 0 Hz -> 0 Mel.
                    t = mVal / mMax;
                    break;
                case 'CUSTOM':
                    // Just purely index based usually, but if freq based:
                    // (f/maxF)^exp
                    t = Math.pow(f / maxF, customExponent);
                    break;
            }

            // Apply Transfer Function for Frequency X Position
            if (this.config.freqToXStrategy) {
                t = calculateTransferFunction(t, 0, 1, this.config.freqToXStrategy);
            }

            return this.width * 0.05 + t * (this.width * 0.9);
        };

        // Helper: Index to Freq (Approximation)
        const getFreqForIndex = (i: number) => (i / N) * this.NYQUIST;

        // 2. Draw Grid
        this.drawGrid(p, getXforFreq, minF, maxF);

        // 3. Prepare Color Strategy
        this.colorStrategy.setup(p, this.config);

        // 4. Draw Bubbles
        const updateAndDraw = (mode: 'REAL' | 'IMAG') => {
            const isReal = mode === 'REAL';
            const states = isReal ? this.nodeStatesReal : this.nodeStatesImag;

            const centerY = this.height / 2;

            for (let i = 0; i < N; i++) {
                const complex = finalStage[i];
                const val = isReal ? complex.re : complex.im;
                const absVal = Math.abs(val); // Magnitude of component

                const f = getFreqForIndex(i);
                if (scaleMode === 'LOG' && f < minF) continue; // Skip low freq in log mode

                // --- ADSR Logic ---
                // (Copied/Adapted from Butterfly)
                let current = states[i];

                // Normalize? 
                // Butterfly normalizes using LOG or NONE.
                // Let's use raw for now or verify config.
                // Re-use logic:
                let targetMag = absVal;
                // Normalization removed as it's not in config. Use raw magnitude.

                if (targetMag > current) {
                    const factor = 1.0 - Math.min(0.99, this.envConfig.attackTime);
                    current += (targetMag - current) * factor;
                } else {
                    const diff = current - targetMag;
                    if (diff > 0.000001) {
                        const shape = Math.max(0.1, this.envConfig.curveShape);
                        const releaseBase = 1.0 - Math.min(0.999, this.envConfig.releaseTime);
                        let factor = Math.pow(diff, shape - 1.0);
                        if (!isFinite(factor)) factor = 0;
                        let decay = releaseBase * factor;
                        if (decay > diff) decay = diff;
                        current -= decay;
                    } else {
                        current = targetMag;
                    }
                }
                states[i] = current;
                // ------------------

                if (current < 0.001) continue;

                const x = getXforFreq(f);

                // Apply Transfer Function for Size
                let sizeInput = current;
                if (this.config.magToSizeStrategy) {
                    sizeInput = calculateTransferFunction(current, 0, 1, this.config.magToSizeStrategy);
                }

                const size = Math.min(maxSize, Math.max(minSize, sizeInput * sizeScale * 100)); // Scaled size

                // Apply Color
                // We pass full complex to maintain relation, but this might be confusing if showing split?
                // If showing "Real", maybe we want color to indicate it is Real?
                // User said "Color mapping same as Butterfly".
                // So we use standard strategy.

                // Note: Butterfly `drawNode` calls `colorStrategy.apply(..., { complex, magnitude, adsrValue, ... })`.
                // We should populate this context.

                const vizComplex = isReal ? { re: complex.re, im: 0 } : { re: 0, im: complex.im };
                // Recalculate generic magnitude for color strategy input (though distinct from ADSR size)
                const vizMag = Math.sqrt(vizComplex.re ** 2 + vizComplex.im ** 2);

                this.colorStrategy.apply(p, {
                    complex: vizComplex,
                    magnitude: vizMag,
                    adsrValue: current,
                    index: i,
                    total: N,
                    stageIndex: stageIndex
                }, this.config);

                p.circle(x, centerY, size);
            }
        };

        if (showMode === 'BOTH' || showMode === 'REAL') updateAndDraw('REAL');
        if (showMode === 'BOTH' || showMode === 'IMAG') updateAndDraw('IMAG');
    }

    private drawGrid(p: p5, getX: (f: number) => number, minF: number, maxF: number) {
        p.push();
        const { gridColor } = this.config;
        p.stroke(gridColor.h, gridColor.l, gridColor.l, 30); // Faint
        p.strokeWeight(1);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.textSize(10);
        p.fill(gridColor.h, gridColor.s, gridColor.l, 150);

        const { scaleMode } = this.config;

        if (scaleMode === 'LOG') {
            // Decades + Subdivisions
            // Let's assume strict decades 20, 200, 2k, 20k for simplicity and compliance.
            // Better loop: Start from minF.
            let start = minF;
            while (start < maxF) {
                const end = start * 10;
                const step = (end - start) / 10;

                // Draw 10 steps
                for (let k = 0; k <= 10; k++) {
                    const f = start + step * k;
                    if (f > maxF) break;

                    const x = getX(f);

                    // Style
                    if (k === 0 || k === 10) {
                        // Decade line (Major)
                        p.stroke(gridColor.h, gridColor.s, gridColor.l, 60);
                        // Label
                        if (x > 0 && x < this.width) {
                            // Format k or M
                            let label = f >= 1000 ? (f / 1000) + 'k' : Math.round(f).toString();
                            p.noStroke();
                            p.text(label, x, this.height - 2);
                            p.stroke(gridColor.h, gridColor.s, gridColor.l, 60);
                        }
                    } else {
                        // Minor
                        p.stroke(gridColor.h, gridColor.s, gridColor.l, 15);
                    }

                    if (x > 0 && x < this.width) {
                        p.line(x, 0, x, this.height);
                    }
                }

                start = end;
            }

        } else if (scaleMode === 'LINEAR') {
            // Linear Grid (e.g. every 1k or 5k)
            for (let f = 0; f < maxF; f += 5000) {
                const x = getX(f);
                p.stroke(gridColor.h, gridColor.s, gridColor.l, 60);
                p.line(x, 0, x, this.height);
                p.noStroke();
                p.text(f / 1000 + 'k', x, this.height - 2);
            }
        }

        p.pop();
    }
}
