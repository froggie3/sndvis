import type p5 from 'p5';
import type { ColorCapableConfig } from '../config.js';
import type { IColorStrategy, ColorContext } from './IColorStrategy.js';
import { calculateTransferFunction } from '../../domain/transfer-function.js';

export class PhaseHueStrategy implements IColorStrategy {
    setup(p: p5, _config: ColorCapableConfig): void {
        p.colorMode(p.HSL, 360, 100, 100);
    }

    apply(p: p5, context: ColorContext, config: ColorCapableConfig): void {
        const { complex } = context;
        // Calculate Phase
        const phase = Math.atan2(complex.im, complex.re); // -PI to PI
        // Normalize phase to 0..1
        let normPhase = (phase + Math.PI) / (2 * Math.PI); // 0..1

        // Apply Transfer Function to Phase
        if (config.phaseToHueStrategy) {
            normPhase = calculateTransferFunction(normPhase, 0, 1, config.phaseToHueStrategy);
        }

        // Map using Offset and RangeRatio
        // Starting point is hueOffset, mapping range is hueRangeRatio * 360
        let hue = config.hueOffset + normPhase * config.hueRangeRatio * 360;

        // Wrap to 0..360 correctly even for negative results
        hue = ((hue % 360) + 360) % 360;

        const sat = config.hueSaturation;

        // ADSR to Lightness
        let lightnessInput = context.adsrValue;
        if (config.adsrToLightnessStrategy) {
            lightnessInput = calculateTransferFunction(lightnessInput, 0, 1, config.adsrToLightnessStrategy);
        }

        const bri = Math.min(100, lightnessInput * config.hueLightnessScale);

        // Round to avoid caching explosion
        p.fill(Math.round(hue), Math.round(sat), Math.round(bri));
    }
}

export class FreqGradientStrategy implements IColorStrategy {
    setup(p: p5, _config: ColorCapableConfig): void {
        p.colorMode(p.HSL, 360, 100, 100);
    }

    apply(p: p5, context: ColorContext, config: ColorCapableConfig): void {
        const { index, total, complex } = context;

        // Freq -> Hue (Gradient)
        // i is index, N is total.
        let t = index / (total - 1);

        // Apply Transfer Function to Frequency Gradient Position
        if (config.freqToHueStrategy) {
            t = calculateTransferFunction(t, 0, 1, config.freqToHueStrategy);
        }

        const hue = p.lerp(config.freqHueStart, config.freqHueEnd, t);
        const finalHue = (hue + 360) % 360;

        // Phase -> Brightness
        const phase = Math.atan2(complex.im, complex.re);
        const normPhase = (phase + Math.PI) / (2 * Math.PI); // 0..1

        // Note: FreqGradientStrategy uses Phase for brightness, not ADSR.
        // If we wanted to map this phase-brightness:
        // let briT = normPhase;
        // if(config.phaseToHueStrategy) ... ? But phaseToHue is for HUE.
        // Maybe we just leave this as raw phase brightness for now unless user requested otherwise.
        // User request "Phase to Hue" is specific.

        const bri = normPhase * 100;
        const sat = config.hueSaturation;

        // Note: We ignore adsrValue for brightness here as per requested design,
        // but user might want to fade out silence? 
        // Original implementation didn't use ADSR for alpha in this mode, 
        // relying on circle size (controlled by ADSR) to hide silent nodes.

        // Round to avoid caching explosion
        p.fill(Math.round(finalHue), Math.round(sat), Math.round(bri));
    }
}
