import type p5 from 'p5';
import { calculateTransferFunction } from '../../../domain/transfer-function.js';
import type { IRendererContext } from '../types.js';

export abstract class BaseButterflyRenderer {
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

        // Apply Transfer Function for Normalization
        // We assume targetMag is mostly in 0..1 range after the switch, or at least max of interest is 1.
        if (config.magNormStrategy) {
            targetMag = calculateTransferFunction(targetMag, 0, 1, config.magNormStrategy);
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
        // Apply Transfer Function for Size
        let sizeInput = current;
        if (config.magToSizeStrategy) {
            sizeInput = calculateTransferFunction(current, 0, 1, config.magToSizeStrategy);
        }

        // Size = Base + (NormalizedValue * Scale * FractalFactor)
        // Spec: "currentVal に sizeScale と scaleFactor を掛けて描画"
        const size = Math.min(maxSize, minSize + sizeInput * sizeScale * fractalFactor);

        p.noStroke();

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
