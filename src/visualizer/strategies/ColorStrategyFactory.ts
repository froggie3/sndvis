import type { VisualizerColorMode } from '../config.js';
import type { IColorStrategy } from './IColorStrategy.js';
import { PhaseHueStrategy, FreqGradientStrategy } from './ConcreteStrategies.js';

export class ColorStrategyFactory {
    // Singleton instances (Stateless enough since config is passed in apply/setup)
    private static strategies: Record<VisualizerColorMode, IColorStrategy> = {
        'PhaseHue': new PhaseHueStrategy(),
        'FreqGradient_PhaseBrightness': new FreqGradientStrategy()
    };

    static getStrategy(mode: VisualizerColorMode): IColorStrategy {
        return this.strategies[mode] || this.strategies['PhaseHue'];
    }
}
