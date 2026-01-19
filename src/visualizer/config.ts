export type VisualizerColorMode = 'BrightnessMap' | 'PhaseHue' | 'FreqGradient_PhaseBrightness';

export interface ButterflyVisualizerConfig {
    name: string;

    // Size Configuration
    minSize: number;
    maxSize: number;
    sizeScale: number;

    // Color Configuration
    colorMode: VisualizerColorMode;

    // BrightnessMap specific
    brightnessR: number;
    brightnessB: number;
    brightnessGScale: number; // Multiplier for magnitude to get Green component

    hueOffset: number;   // 0-360
    hueRangeRatio: number; // -1.0 to 1.0 (Mapping expansion/contraction)
    hueSaturation: number; // 0-100
    hueBrightnessScale: number; // Multiplier for magnitude to get Brightness

    // FreqGradient_PhaseBrightness specific
    freqHueStart: number;
    freqHueEnd: number;

    // View Configuration
    selectedStageIndex: number; // -1 for All, 0..N for specific stage
    rotation: 0 | 90; // 0 or 90 degrees
}

export const VIZ_PRESETS: ButterflyVisualizerConfig[] = [
    {
        name: "Default (Blue-ish)",
        minSize: 2,
        maxSize: 20,
        sizeScale: 5,
        colorMode: 'BrightnessMap',
        brightnessR: 100,
        brightnessB: 255,
        brightnessGScale: 50,
        // Unused
        hueOffset: 0,
        hueRangeRatio: 1.0,
        hueSaturation: 80,
        hueBrightnessScale: 100,
        freqHueStart: 240,
        freqHueEnd: 0,
        selectedStageIndex: -1,
        rotation: 0
    },
    {
        name: "Phase -> Hue",
        minSize: 2,
        maxSize: 20,
        sizeScale: 5,
        colorMode: 'PhaseHue',
        brightnessR: 100,
        brightnessB: 255,
        brightnessGScale: 50,
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
        sizeScale: 5,
        colorMode: 'FreqGradient_PhaseBrightness',
        brightnessR: 0,
        brightnessB: 0,
        brightnessGScale: 0,
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
