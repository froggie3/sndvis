import { reactive } from 'vue';
import p5 from 'p5';
import { FFTProcessor } from '../domain/fft-processor.js';
import { SpectralWhitener } from '../domain/spectral-whitener.js';
import { ButterflyVisualizer } from '../visualizer/ButterflyVisualizer.js';
import { TestSignalSource } from '../io/TestSignalSource.js';
import { MicrophoneSource } from '../io/MicrophoneSource.js';
import { FileAudioSource } from '../io/FileAudioSource.js';
import { RealtimeLoop } from '../io/RealtimeLoop.js';
import { OfflineExportLoop } from '../io/OfflineExportLoop.js';
import type { IAudioSource } from '../io/IAudioSource.js';
import type { IRenderLoop } from '../io/IRenderLoop.js';
import type { EnvelopeConfig } from '../domain/envelope-config.js';
import type { ButterflyVisualizerConfig } from '../visualizer/config.js';

// Global State
const N = 128;
export const processor = new FFTProcessor(N);
export const whitener = new SpectralWhitener(N);
whitener.setAmount(0.6);

export const visualizer = new ButterflyVisualizer();
// We might want to make visualizer config reactive or expose it via a store

// Reactive State for UI
export const appState = reactive({
    currentSourceType: 'test',
    isExporting: false,
    exportProgress: 0,
});

let currentSource: IAudioSource;
let driver: IRenderLoop | null = null;
let p5Instance: p5 | null = null;
let sharedAudioContext: AudioContext | null = null;

// Audio Context Helper
function getAudioContext(): AudioContext {
    if (!sharedAudioContext) {
        sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return sharedAudioContext;
}

// Initialization called by App or Canvas
export function initAudio(p: p5) {
    p5Instance = p;

    // Initial Setup
    // Default Source
    currentSource = new TestSignalSource(N);

    startDriver();
}

function startDriver() {
    if (!p5Instance) return;
    if (driver) driver.stop();

    if (currentSource instanceof TestSignalSource) whitener.reset();

    driver = new RealtimeLoop(currentSource, processor, whitener, visualizer, p5Instance);
    driver.start();
}

export async function switchSource(type: string) {
    if (driver) driver.stop();
    if (currentSource) currentSource.disconnect();

    appState.currentSourceType = type;

    switch (type) {
        case 'mic':
            currentSource = new MicrophoneSource(N);
            break;
        case 'file':
            currentSource = new FileAudioSource(N);
            break;
        case 'test':
        default:
            currentSource = new TestSignalSource(N);
            break;
    }

    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
        await ctx.resume();
    }

    try {
        await currentSource.initialize(ctx);
    } catch (err) {
        console.error("Failed to initialize source:", err);
        alert("Failed to initialize audio source. Check permissions.");
        return;
    }

    startDriver();
}

export function loadAudioFile(file: File) {
    if (currentSource instanceof FileAudioSource) {
        currentSource.loadFile(file);
    }
}

export async function startExport() {
    if (!p5Instance || !driver) return;

    appState.isExporting = true;
    appState.exportProgress = 0;

    driver.stop();

    const exportDriver = new OfflineExportLoop(
        currentSource,
        processor,
        whitener,
        visualizer,
        p5Instance
    );

    driver = exportDriver;

    exportDriver.onProgress = (percent) => {
        appState.exportProgress = percent;
    };

    exportDriver.onComplete = (blob) => {
        appState.isExporting = false;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `viz_${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);

        // Resume Realtime
        setTimeout(() => {
            startDriver();
        }, 500);
    };

    driver.start();
}

// Config Helpers
export function setEnvelopeConfig(cfg: EnvelopeConfig) {
    visualizer.setConfig(cfg);
}

export function setVisualizerConfig(cfg: ButterflyVisualizerConfig) {
    visualizer.importSettings(cfg);
}
