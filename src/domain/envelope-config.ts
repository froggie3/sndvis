export interface EnvelopeConfig {
    name?: string;
    attackTime: number;  // 0.0 - 1.0 (smaller = faster attack)
    releaseTime: number; // 0.0 - 1.0 (larger = slower release)
    curveShape: number;  // 1.0 = Linear, >1.0 = Exponential, <1.0 = Logarithmic
}

export const PRESETS: EnvelopeConfig[] = [
    { name: "Digital (Linear)", attackTime: 0.1, releaseTime: 0.9, curveShape: 1.0 },
    { name: "Neon (Exponential)", attackTime: 0.1, releaseTime: 0.95, curveShape: 2.0 },
    { name: "Viscous (Sticky)", attackTime: 0.4, releaseTime: 0.92, curveShape: 0.5 }, // Careful with low shape
    { name: "Instant (Raw)", attackTime: 0.0, releaseTime: 0.0, curveShape: 1.0 }
];
