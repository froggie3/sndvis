import type p5 from 'p5';
import type { ButterflyVisualizerConfig } from '../config.js';

export interface ColorContext {
    complex: { re: number, im: number };
    magnitude: number;
    adsrValue: number; // The smoothed value currently used for size
    index: number;     // Index in stage (i)
    total: number;     // Total nodes in stage (N)
    stageIndex: number;
}

export interface IColorStrategy {
    setup(p: p5, config: ButterflyVisualizerConfig): void;
    apply(p: p5, context: ColorContext, config: ButterflyVisualizerConfig): void;
}
