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
        const { minSize, maxSize, sizeScale, normalizationMode, logBase, useFractalSize, fractalDecay } = config;

        // 1. Calculate Raw Magnitude
        const complex = stages[s][i];
        let rawMag = Math.sqrt(complex.re * complex.re + complex.im * complex.im);

        // 2. Normalization Strategy
        let targetMag = rawMag;
        switch (normalizationMode) {
            case 'LOG':
                // Logarithmic: log(1 + raw) or similar
                // base usually 10 or e.
                // We use logBase from config.
                // Adding 1 to avoid log(0) and keep positive.
                if (targetMag > 0) {
                    targetMag = Math.log(1 + rawMag) / Math.log(logBase);
                }
                break;
            case 'NONE':
            default:
                targetMag = rawMag;
                break;
        }

        // 3. ADSR Update (on the NORMALIZED value)
        let current = nodeStates[s][i];

        if (targetMag > current) {
            const factor = 1.0 - Math.min(0.99, envConfig.attackTime);
            current += (targetMag - current) * factor;
        } else {
            const diff = current - targetMag;
            // Lower threshold for update to stop micro-updates
            if (diff > 0.000001) {
                const shape = Math.max(0.1, envConfig.curveShape);
                const releaseBase = 1.0 - Math.min(0.999, envConfig.releaseTime);
                let factor = Math.pow(diff, shape - 1.0);
                if (!isFinite(factor)) factor = 0;
                let decay = releaseBase * factor;
                if (decay > diff) decay = diff;
                current -= decay;
            } else {
                current = targetMag;
            }
        }

        nodeStates[s][i] = current;

        // 4. Fractal Scaling
        let fractalFactor = 1.0;
        if (useFractalSize) {
            fractalFactor = Math.pow(fractalDecay, s);
        }

        // 5. Calculate Final Size
        // Size = Base + (NormalizedValue * Scale * FractalFactor)
        // We apply fractal factor to the dynamic part usually, or the whole size?
        // User spec: "奧の段...ほど円を小さく"
        // Let's apply to the dynamic component primarily to keep 'minSize' as a baseline visibility,
        // OR apply to the whole thing.
        // If we apply to whole size, it shrinks everything including minSize.
        // Let's apply to the gain part first.
        // Actually, if minSize is constant, deep nodes overlap.
        // It's probably better to scale the whole effective visual footprint, but let's stick to user spec "currentVal に...掛けて".
        // Spec: "currentVal に sizeScale と scaleFactor を掛けて描画"
        const size = Math.min(maxSize, minSize + current * sizeScale * fractalFactor);

        p.noStroke();

        // Color Strategy Apply
        // Note: Strategy might use rawMag or current.
        // To be consistent with visual size, we should probably pass 'current' (which is normalized now).
        // But color strategies might rely on absolute values?
        // Usually color mapping needs minimal tweaking, but let's pass the 'current' as adsrValue.
        // It is now Normalized ADSR Value.
        colorStrategy.apply(p, {
            complex,
            magnitude: rawMag, // Raw mag preserved for physics/color logic if needed
            adsrValue: current, // This is now Normalized & ADSR'd
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
        } else if (rotation === 180) {
            p.translate(width, height);
            p.rotate(p.PI);
            canvasWidth = width;
            canvasHeight = height;
        } else if (rotation === 270) {
            p.translate(0, height);
            p.rotate(-p.HALF_PI); // or 3*HALF_PI
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
        const { p, width, height, config, stages } = ctx;
        const numStages = stages.length;
        const { rotation } = config;

        p.fill(255);
        p.noStroke();

        for (let stgIdx = 0; stgIdx < numStages; stgIdx++) {

            let labelX = 0;
            let labelY = 0;
            let alignX: any = p.CENTER;
            let alignY: any = p.BOTTOM;

            if (rotation === 0) {
                labelX = getX(stgIdx);
                labelY = height - 15;
                alignX = p.CENTER;
                alignY = p.BOTTOM;
            } else if (rotation === 90) {
                // screen X is fixed (near left), screen Y varies with stage
                // Coord transformation:
                // Canvas(x, y) = (stagePos, something) -> Screen?
                // Visualizer puts stages along X in its local space.
                // Rot 90: Local X becomes Screen Y (down). Local Y becomes Screen X (left <- wait, 90 clockwise)
                // Let's analyze 90 deg again: translate(w,0), rotate(90).
                // loc(x,y) -> screen(w-y, x) ???
                // Wait, p5 rotation logic:
                // 90deg: x->y, y->-x.
                // translate(w,0): new(0,0) is at top-right. x-axis points down, y-axis points left.
                // So stage index (along local X) goes DOWN the screen.
                // We want text to be at "bottom" relative to the graph, which is left side of screen?
                // Existing 90 logic: p.text(..., 15, screenY) where screenY = getX(s).
                // This means '15' is Screen X (left side) and getX(s) is Screen Y.
                // That matches "stages go down".

                labelX = 15;
                labelY = getX(stgIdx);
                alignX = p.LEFT;
                alignY = p.CENTER;
            } else if (rotation === 180) {
                // translate(w, h), rotate(180).
                // x -> -x, y -> -y.
                // stage axis (local X) goes left.
                // "bottom" of graph (local Y max) is top of screen (Screen Y=0).
                // We want text at Screen Y = 15 (top).
                // Screen X: varies.
                // geometric X for stage s: getX(s). in screen: w - getX(s) ?
                // Let's just use the fact that we draw OUTSIDE the push/pop of rotation.
                // Wait, drawLabels *draws* assuming screen coords? No, it uses 'p' which is global?
                // drawLabels is called *after* p.pop(). So p is in Identity transform (screen coords).
                // But getX(s) returns coordinates in the Local Space of the visualizer (0..CanvasWidth).

                // Rotation 0: ScreenX = LocalX = getX(s). ScreenY = Height - 15.
                // Rotation 90: ScreenY = LocalX = getX(s). ScreenX = 15. (Stages run top-to-bottom)
                // Rotation 180: Stages run right-to-left.
                //   Local origin is Top-Right of screen, X goes left.
                //   Visualizer width W. Stage 0 at marginX. Stage N at W-margin.
                //   Screen X for Local X: W - LocalX.
                //   "Bottom" of visualizer is Local Y=H. Screen coords: Top (Y=0).
                //   So Label Y = 15.

                labelX = width - getX(stgIdx);
                labelY = 15;
                alignX = p.CENTER;
                alignY = p.TOP;
            } else if (rotation === 270) {
                // translate(0, h), rotate(-90).
                // x -> y, y -> -x.
                // Stages run bottom-to-top.
                // Local X becomes Screen Y (up).
                // Local Y becomes Screen X (right).
                // Origin (0,h) is Bottom-Left.
                // Local X axis goes Up.
                // Screen Y = h - LocalX.
                // "Bottom" of visualizer (Local Y=H) is Right side of screen.
                // So Label X = width - 15.

                labelX = width - 15;
                labelY = height - getX(stgIdx);
                alignX = p.RIGHT;
                alignY = p.CENTER;
            }

            p.textAlign(alignX, alignY);
            p.text(`S${stgIdx}`, labelX, labelY);
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
        } else if (rotation === 180) {
            p.translate(width, height);
            p.rotate(p.PI);
            canvasWidth = width;
            canvasHeight = height;
        } else if (rotation === 270) {
            p.translate(0, height);
            p.rotate(-p.HALF_PI);
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

        let labelX = 0;
        let labelY = 0;
        let alignX: any = p.CENTER;
        let alignY: any = p.BOTTOM;


        // NOTE: In SingleStage, 'centerX' is the coordinate in the LOCAL transformed space where nodes are drawn.
        // It's calculated *based on transformed dimensions*.
        // However, we are now outside the transform (p.pop called).
        // So we need Screen Coords.

        // SingleStageRenderer always draws nodes at the "center of the visual area" along the non-stage axis.
        // And the stage axis doesn't exist spatially, it's just one stage.
        // In MultiStage layout, we used getX(s) to find the stage line.
        // Here, the nodes are at local coord 'centerX' (which is half the trans-width).
        // Let's trace 'centerX':
        // Rot 0: canvasWidth=width. centerX=width/2. ScreenX=width/2.
        // Rot 90: canvasWidth=height. centerX=height/2. ScreenY=height/2. ScreenX?? 
        // SingleStage uses:  this.drawNode(p, s, i, centerX, y, ctx);
        //   where 'y' is along the node-axis (Local Y).
        //   'centerX' is along the stage-axis (Local X).
        // Effectively it draws a vertical line of nodes in the middle of Local Space.

        if (rotation === 0) {
            // Local X = width/2. Local Y varies.
            // Screen X = width/2.
            labelX = width / 2;
            labelY = height - 15;
            alignX = p.CENTER;
            alignY = p.BOTTOM;
        } else if (rotation === 90) {
            // Local X = height/2 (vertical center of unrotated key).
            // Rotated 90: Local X axis points Down. 
            // The line of nodes is at LocalX = height/2.
            // Screen Y = height/2.
            // We want label at "bottom" of Local Y, which is Left of Screen.
            labelX = 15;
            labelY = height / 2;
            alignX = p.LEFT;
            alignY = p.CENTER;
        } else if (rotation === 180) {
            // Local X = width/2.
            // Rotated 180: Local X axis points Left.
            // Screen X = width - LocalX = width/2.
            // Local Y axis points Up (Screen Y 0).
            // We want label at Top of Screen.
            labelX = width / 2;
            labelY = 15;
            alignX = p.CENTER;
            alignY = p.TOP;
        } else if (rotation === 270) {
            // Local X = height/2.
            // Rotated 270: Local X axis points Up.
            // Screen Y = height - LocalX = height/2.
            // Local Y axis points Right.
            // We want label at Right of Screen.
            labelX = width - 15;
            labelY = height / 2;
            alignX = p.RIGHT;
            alignY = p.CENTER;
        }

        p.textAlign(alignX, alignY);
        p.text(`S${s}`, labelX, labelY);
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
