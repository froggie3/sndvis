import type p5 from 'p5';
import type { FFTSnapshot } from '../domain/types.js';

export interface IVisualizer {
    setup(p: p5, width: number, height: number): void;
    draw(p: p5, snapshot: FFTSnapshot): void;
    resize(width: number, height: number): void;
    setConfig(config: any): void;
}
