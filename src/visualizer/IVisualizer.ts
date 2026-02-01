import type p5 from 'p5';
import type { FFTResult } from '../domain/types.js';

export interface VisualizerRequirements {
    readonly needsHistory: boolean;
}

export interface IVisualizer {
    readonly requirements: VisualizerRequirements;
    setup(p: p5, width: number, height: number): void;
    draw(p: p5, data: FFTResult): void;
    resize(width: number, height: number): void;
    setConfig(config: any): void;
}
