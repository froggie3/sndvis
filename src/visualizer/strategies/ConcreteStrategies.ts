import type p5 from 'p5';
import type { ButterflyVisualizerConfig } from '../config.js';
import type { IColorStrategy, ColorContext } from './IColorStrategy.js';

export class BrightnessMapStrategy implements IColorStrategy {
    setup(p: p5, _config: ButterflyVisualizerConfig): void {
        p.colorMode(p.RGB, 255);
    }

    apply(p: p5, context: ColorContext, config: ButterflyVisualizerConfig): void {
        const { brightnessR, brightnessB, brightnessGScale } = config;
        const brightness = Math.min(255, context.adsrValue * brightnessGScale);
        p.fill(brightnessR, brightness, brightnessB);
    }
}

export class PhaseHueStrategy implements IColorStrategy {
    setup(p: p5, _config: ButterflyVisualizerConfig): void {
        p.colorMode(p.HSB, 360, 100, 100, 100);
    }

    apply(p: p5, context: ColorContext, config: ButterflyVisualizerConfig): void {
        const { complex } = context;
        // Calculate Phase
        const phase = Math.atan2(complex.im, complex.re); // -PI to PI
        // Map -PI..PI to 0..360
        let hue = p.degrees(phase) + config.hueOffset;
        if (hue < 0) hue += 360;
        hue = hue % 360;

        const sat = config.hueSaturation;
        const bri = Math.min(100, context.adsrValue * config.hueBrightnessScale);

        p.fill(hue, sat, bri);
    }
}

export class FreqGradientStrategy implements IColorStrategy {
    setup(p: p5, _config: ButterflyVisualizerConfig): void {
        p.colorMode(p.HSB, 360, 100, 100, 100);
    }

    apply(p: p5, context: ColorContext, config: ButterflyVisualizerConfig): void {
        const { index, total, complex } = context;

        // Freq -> Hue (Gradient)
        // i is index, N is total.
        const t = index / (total - 1);
        const hue = p.lerp(config.freqHueStart, config.freqHueEnd, t);
        const finalHue = (hue + 360) % 360;

        // Phase -> Brightness
        const phase = Math.atan2(complex.im, complex.re);
        const normPhase = (phase + Math.PI) / (2 * Math.PI); // 0..1

        const bri = normPhase * 100;
        const sat = config.hueSaturation;

        // Note: We ignore adsrValue for brightness here as per requested design,
        // but user might want to fade out silence? 
        // Original implementation didn't use ADSR for alpha in this mode, 
        // relying on circle size (controlled by ADSR) to hide silent nodes.

        p.fill(finalHue, sat, bri);
    }
}
