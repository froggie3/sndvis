import type p5 from 'p5';
import type { FFTSnapshot, FFTResult } from '../domain/types.js';
import type { IVisualizer, VisualizerRequirements } from './IVisualizer.js';
import { type EnvelopeConfig, PRESETS } from '../domain/envelope-config.js';
import type { Importable, Exportable } from '../domain/mixins.js';
import { VIZ_PRESETS, type ButterflyVisualizerConfig } from './config.js';
import type { IColorStrategy } from './strategies/IColorStrategy.js';
import { ColorStrategyFactory } from './strategies/ColorStrategyFactory.js';
import type { IRendererContext } from './butterfly/types.js';
import type { BaseButterflyRenderer } from './butterfly/renderers/BaseButterflyRenderer.js';
import { MultiStageRenderer } from './butterfly/renderers/MultiStageRenderer.js';
import { SingleStageRenderer } from './butterfly/renderers/SingleStageRenderer.js';


export class ButterflyVisualizer implements IVisualizer, Importable<ButterflyVisualizerConfig>, Exportable<ButterflyVisualizerConfig> {
    private width: number = 0;
    private height: number = 0;

    public get requirements(): VisualizerRequirements {
        return { needsHistory: true };
    }

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

    draw(p: p5, data: FFTResult): void {
        const snapshot = data as FFTSnapshot;
        if (!snapshot.stages) {
            console.warn("ButterflyVisualizer requires full FFT history.");
            return;
        }
        const stages = snapshot.stages;
        const numStages = stages.length;
        const N = stages[0].length;

        // Initialize States if needed
        if (this.nodeStates.length !== numStages || this.nodeStates[0]?.length !== N) {
            this.nodeStates = Array.from({ length: numStages }, () => new Array(N).fill(0));
        }

        p.colorMode(p.HSL, 360, 100, 100);
        const { h, s, l } = this.config.backgroundColor;
        p.background(h, s, l);

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
