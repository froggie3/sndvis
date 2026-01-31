import type p5 from 'p5';
import type { ComplexArray } from '../../domain/types.js';
import type { EnvelopeConfig } from '../../domain/envelope-config.js';
import type { ButterflyVisualizerConfig } from '../config.js';
import type { IColorStrategy } from '../strategies/IColorStrategy.js';

export interface IRendererContext {
    width: number;
    height: number;
    p: p5;
    config: ButterflyVisualizerConfig;
    colorStrategy: IColorStrategy;
    nodeStates: number[][];
    envConfig: EnvelopeConfig;
    stages: ComplexArray[];
}
