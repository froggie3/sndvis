import type p5 from 'p5';
import type { FFTSnapshot, ComplexArray } from '../domain/types.js';
import type { IVisualizer } from './IVisualizer.js';
import { type EnvelopeConfig, PRESETS } from '../domain/envelope-config.js';
import type { Importable, Exportable } from '../domain/mixins.js';
import { VIZ_PRESETS, type ButterflyVisualizerConfig } from './config.js';
import type { IColorStrategy } from './strategies/IColorStrategy.js';
import { ColorStrategyFactory } from './strategies/ColorStrategyFactory.js';

// --- Renderer Strategy Interface ---
interface IRendererContext {
    width: number;
    height: number;
    p: p5;
    config: ButterflyVisualizerConfig;
    colorStrategy: IColorStrategy;
    nodeStates: number[][];
    envConfig: EnvelopeConfig;
    stages: ComplexArray[];
}

abstract class BaseButterflyRenderer {
    protected marginX = 50;
    protected marginY = 50;

    constructor() { }

    abstract draw(ctx: IRendererContext): void;

    protected drawNode(
        p: p5,
        s: number,
        i: number,
        x: number,
        y: number,
        ctx: IRendererContext
    ) {
        const { stages, nodeStates, config, envConfig, colorStrategy } = ctx;
        const N = stages[0].length;
        const { minSize, maxSize, sizeScale } = config;

        // 1. Calculate Target Intensity
        const complex = stages[s][i];
        const rawMag = Math.sqrt(complex.re * complex.re + complex.im * complex.im);

        // 2. ADSR Update
        let current = nodeStates[s][i];

        if (rawMag > current) {
            const factor = 1.0 - Math.min(0.99, envConfig.attackTime);
            current += (rawMag - current) * factor;
        } else {
            const diff = current - rawMag;
            if (diff > 0.0001) {
                const shape = Math.max(0.1, envConfig.curveShape);
                const releaseBase = 1.0 - Math.min(0.999, envConfig.releaseTime);
                let factor = Math.pow(diff, shape - 1.0);
                if (!isFinite(factor)) factor = 0;
                let decay = releaseBase * factor;
                if (decay > diff) decay = diff;
                current -= decay;
            } else {
                current = rawMag;
            }
        }

        nodeStates[s][i] = current;

        // 3. Visualization
        const size = Math.min(maxSize, minSize + current * sizeScale);

        p.noStroke();

        // Color Strategy Apply
        colorStrategy.apply(p, {
            complex,
            magnitude: rawMag,
            adsrValue: current,
            index: i,
            total: N,
            stageIndex: s
        }, config);

        p.circle(x, y, size);
    }
}

class MultiStageRenderer extends BaseButterflyRenderer {
    draw(ctx: IRendererContext): void {
        const { p, width, height, stages, config } = ctx;
        const numStages = stages.length;
        const N = stages[0].length;
        const { rotation } = config;

        // Apply Rotation Transform
        p.push();
        let canvasWidth = width;
        let canvasHeight = height;

        if (rotation === 90) {
            p.translate(width, 0);
            p.rotate(p.HALF_PI);
            canvasWidth = height;
            canvasHeight = width;
        }

        const stageStride = (canvasWidth - 2 * this.marginX) / (numStages - 1);
        const nodeStride = (canvasHeight - 2 * this.marginY) / (N - 1);

        const getX = (stageIndex: number) => this.marginX + stageIndex * stageStride;
        const getY = (nodeIndex: number) => this.marginY + nodeIndex * nodeStride;

        // Draw connections (Butterflies)
        p.strokeWeight(1);
        p.noFill();
        for (let s = 0; s < numStages - 1; s++) {
            const butterflySize = 1 << (s + 1);
            const halfSize = butterflySize >> 1;

            p.stroke(100, 150, 255, 100);

            for (let i = 0; i < N; i += butterflySize) {
                for (let j = 0; j < halfSize; j++) {
                    const k = i + j;
                    const m = i + j + halfSize;
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
        p.push();
        ctx.colorStrategy.setup(p, config);

        for (let s = 0; s < numStages; s++) {
            const x = getX(s);
            for (let i = 0; i < N; i++) {
                const y = getY(i);
                this.drawNode(p, s, i, x, y, ctx);
            }
        }
        p.pop(); // Restore node style

        p.pop(); // Restore rotation

        // Labels
        this.drawLabels(ctx, getX);
    }

    private drawLabels(ctx: IRendererContext, getX: (s: number) => number) {
        const { p, height, config, stages } = ctx;
        const numStages = stages.length;
        const { rotation } = config;

        p.fill(255);
        p.noStroke();

        for (let s = 0; s < numStages; s++) {
            if (rotation === 90) {
                // Rotated logic: Screen coords
                const screenY = getX(s);
                p.textAlign(p.LEFT, p.CENTER);
                p.text(`S${s}`, 15, screenY);
            } else {
                const screenX = getX(s);
                p.textAlign(p.CENTER, p.BOTTOM);
                p.text(`S${s}`, screenX, height - 15);
            }
        }
    }
}

class SingleStageRenderer extends BaseButterflyRenderer {
    draw(ctx: IRendererContext): void {
        const { p, width, height, stages, config } = ctx;
        const N = stages[0].length;
        const { rotation, selectedStageIndex } = config;

        // Safety check
        if (selectedStageIndex < 0 || selectedStageIndex >= stages.length) return;

        // Apply Rotation Transform
        p.push();
        let canvasWidth = width;
        let canvasHeight = height;

        if (rotation === 90) {
            p.translate(width, 0);
            p.rotate(p.HALF_PI);
            canvasWidth = height;
            canvasHeight = width;
        }

        const nodeStride = (canvasHeight - 2 * this.marginY) / (N - 1);
        const centerX = canvasWidth / 2;
        const getY = (nodeIndex: number) => this.marginY + nodeIndex * nodeStride;

        // Draw Nodes
        p.push();
        ctx.colorStrategy.setup(p, config);

        const s = selectedStageIndex;
        for (let i = 0; i < N; i++) {
            const y = getY(i);
            this.drawNode(p, s, i, centerX, y, ctx);
        }
        p.pop(); // Restore node style

        p.pop(); // Restore rotation

        // Labels
        p.fill(255);
        p.noStroke();

        if (rotation === 90) {
            p.textAlign(p.LEFT, p.CENTER);
            p.text(`S${s}`, 15, centerX);
        } else {
            p.textAlign(p.CENTER, p.BOTTOM);
            p.text(`S${s}`, centerX, height - 15);
        }
    }
}


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

    // Renderer Strategy
    private renderer: BaseButterflyRenderer;

    constructor() {
        this.colorStrategy = ColorStrategyFactory.getStrategy(this.config.colorMode);
        this.renderer = new MultiStageRenderer();
    }

    // IVisualizer config (Envelope)
    setConfig(config: EnvelopeConfig): void {
        this.envConfig = config;
    }

    // Importable Implementation
    importSettings(settings: ButterflyVisualizerConfig): void {
        this.config = { ...settings };
        this.colorStrategy = ColorStrategyFactory.getStrategy(this.config.colorMode);
        this.updateRenderer();
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

    private updateRenderer() {
        // Simple logic: if selectedStageIndex is -1 or out of bounds (though out of bounds usually handled in draw safety), use Multi
        const useSingle = this.config.selectedStageIndex >= 0;

        // Check if we need to switch (optimization: typically cheap to just swap)
        if (useSingle && !(this.renderer instanceof SingleStageRenderer)) {
            this.renderer = new SingleStageRenderer();
        } else if (!useSingle && !(this.renderer instanceof MultiStageRenderer)) {
            this.renderer = new MultiStageRenderer();
        }
    }

    draw(p: p5, snapshot: FFTSnapshot): void {
        const stages = snapshot.stages;
        const numStages = stages.length;
        const N = stages[0].length;

        // Initialize States if needed
        if (this.nodeStates.length !== numStages || this.nodeStates[0]?.length !== N) {
            this.nodeStates = Array.from({ length: numStages }, () => new Array(N).fill(0));
        }

        p.background(20); // Dark background

        // Delegate to Renderer
        const ctx: IRendererContext = {
            width: this.width,
            height: this.height,
            p,
            config: this.config,
            colorStrategy: this.colorStrategy,
            nodeStates: this.nodeStates,
            envConfig: this.envConfig,
            stages
        };

        this.renderer.draw(ctx);
    }
}
