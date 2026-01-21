export type VisualizerColorMode = 'PhaseHue' | 'FreqGradient_PhaseBrightness';
export type NormalizationMode = 'NONE' | 'LOG';

export interface ButterflyVisualizerConfig {
    name: string;

    // Size Configuration
    minSize: number;
    maxSize: number;
    sizeScale: number;

    // Normalization
    normalizationMode: NormalizationMode;
    logBase: number;

    // Fractal
    useFractalSize: boolean;
    fractalDecay: number;

    // Color Configuration
    colorMode: VisualizerColorMode;

    hueOffset: number;   // 0-360
    hueRangeRatio: number; // -1.0 to 1.0 (Mapping expansion/contraction)
    hueSaturation: number; // 0-100
    hueBrightnessScale: number; // Multiplier for magnitude to get Brightness

    // FreqGradient_PhaseBrightness specific
    freqHueStart: number;
    freqHueEnd: number;

    // View Configuration
    selectedStageIndex: number; // -1 for All, 0..N for specific stage
    rotation: 0 | 90 | 180 | 270; // 0, 90, 180, 270 degrees
}

export const VIZ_PRESETS: ButterflyVisualizerConfig[] = [
    {
        name: "Default (Blue-ish)",
        minSize: 1,
        maxSize: 100,
        sizeScale: 84,
        normalizationMode: 'LOG',
        logBase: 10,
        useFractalSize: true,
        fractalDecay: 0.9,
        colorMode: 'PhaseHue',
        hueOffset: 180,
        hueRangeRatio: 0.1,
        hueSaturation: 80,
        hueBrightnessScale: 200,
        freqHueStart: 240,
        freqHueEnd: 0,
        selectedStageIndex: -1,
        rotation: 0
    },
    {
        name: "Phase -> Hue",
        minSize: 2,
        maxSize: 20,
        sizeScale: 50,
        normalizationMode: 'LOG',
        logBase: 10,
        useFractalSize: true,
        fractalDecay: 0.9,
        colorMode: 'PhaseHue',
        hueOffset: 0,
        hueRangeRatio: 1.0,
        hueSaturation: 80,
        hueBrightnessScale: 80,
        freqHueStart: 240,
        freqHueEnd: 0,
        selectedStageIndex: -1,
        rotation: 0
    },
    {
        name: "Freq -> Cool/Warm, Phase -> Bri",
        minSize: 2,
        maxSize: 20,
        sizeScale: 50,
        normalizationMode: 'LOG',
        logBase: 10,
        useFractalSize: true,
        fractalDecay: 0.9,
        colorMode: 'FreqGradient_PhaseBrightness',
        hueOffset: 0,
        hueRangeRatio: 1.0,
        hueSaturation: 90,
        hueBrightnessScale: 0,
        freqHueStart: 240, // Blue
        freqHueEnd: 360,    // Red (via Magenta)
        selectedStageIndex: -1,
        rotation: 0
    }
];
