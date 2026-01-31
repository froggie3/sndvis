export interface HSLColor {
    h: number;
    s: number;
    l: number;
}

export type VisualizerColorMode = 'PhaseHue' | 'FreqGradient_PhaseBrightness';
export type NormalizationMode = 'NONE' | 'LOG';
export type ScaleMode = 'LINEAR' | 'LOG' | 'MEL' | 'CUSTOM';
export type ShowMode = 'REAL' | 'IMAG' | 'BOTH';

export interface ColorCapableConfig {
    backgroundColor: HSLColor;
    colorMode: VisualizerColorMode;
    hueOffset: number;   // 0-360
    hueRangeRatio: number; // -1.0 to 1.0 (Mapping expansion/contraction)
    hueSaturation: number; // 0-100
    hueLightnessScale: number; // Multiplier for magnitude to get Brightness
    // FreqGradient_PhaseBrightness specific
    freqHueStart: number;
    freqHueEnd: number;
}

export interface FinalStageVisualizerConfig extends ColorCapableConfig {
    name: string;

    // View
    showMode: ShowMode; // Real, Imag, or Both

    // Scaling
    scaleMode: ScaleMode;
    customExponent: number; // For Custom Scale

    // Grid
    gridBaseFreq: number; // default 20
    gridColor: HSLColor;

    // Appearance
    minSize: number;
    maxSize: number;
    sizeScale: number;
}

export interface ButterflyVisualizerConfig extends ColorCapableConfig {
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

    // View Configuration
    selectedStageIndex: number; // -1 for All, 0..N for specific stage
    rotation: 0 | 90 | 180 | 270; // 0, 90, 180, 270 degrees

    // Lines (Multi only)
    butterflyLineColor: HSLColor;
}

export const VIZ_PRESETS: ButterflyVisualizerConfig[] = [
    {
        name: "Default (Blue-ish)",
        backgroundColor: { h: 0, s: 0, l: 8 },
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
        hueLightnessScale: 78,
        freqHueStart: 240,
        freqHueEnd: 0,
        selectedStageIndex: -1,
        rotation: 0,
        butterflyLineColor: { h: 221, s: 50, l: 49 }
    },
    {
        name: "Phase -> Hue",
        backgroundColor: { h: 0, s: 0, l: 8 },
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
        hueLightnessScale: 31,
        freqHueStart: 240,
        freqHueEnd: 0,
        selectedStageIndex: -1,
        rotation: 0,
        butterflyLineColor: { h: 221, s: 50, l: 49 }
    },
    {
        name: "Freq -> Cool/Warm, Phase -> Bri",
        backgroundColor: { h: 0, s: 0, l: 8 },
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
        hueLightnessScale: 0,
        freqHueStart: 240, // Blue
        freqHueEnd: 360,    // Red (via Magenta)
        selectedStageIndex: -1,
        rotation: 0,
        butterflyLineColor: { h: 221, s: 50, l: 49 }
    }
];

export const FINAL_STAGE_PRESETS: FinalStageVisualizerConfig[] = [
    {
        name: "Spectrum Analyzer",
        backgroundColor: { h: 0, s: 0, l: 8 },
        showMode: 'BOTH',
        scaleMode: 'LOG',
        customExponent: 2.0,
        minSize: 2,
        maxSize: 50,
        sizeScale: 1.0,
        gridBaseFreq: 20,
        gridColor: { h: 0, s: 0, l: 30 },
        colorMode: 'PhaseHue',
        hueOffset: 0,
        hueRangeRatio: 1.0,
        hueSaturation: 80,
        hueLightnessScale: 78,
        freqHueStart: 240,
        freqHueEnd: 0
    }
];
