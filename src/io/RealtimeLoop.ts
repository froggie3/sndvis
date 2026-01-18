import type { IRenderLoop } from './IRenderLoop.js';
import type { IAudioSource } from './IAudioSource.js';
import { FFTProcessor } from '../domain/fft-processor.js';
import { SpectralWhitener } from '../domain/spectral-whitener.js';
import type { IVisualizer } from '../visualizer/IVisualizer.js';
import p5 from 'p5';

export class RealtimeLoop implements IRenderLoop {
    private source: IAudioSource;
    private processor: FFTProcessor;
    private whitener: SpectralWhitener;
    private visualizer: IVisualizer;
    private p5Instance: p5;

    private _isRunning: boolean = false;
    private rafId: number | null = null;

    constructor(
        source: IAudioSource,
        processor: FFTProcessor,
        whitener: SpectralWhitener,
        visualizer: IVisualizer,
        p5Instance: p5
    ) {
        this.source = source;
        this.processor = processor;
        this.whitener = whitener;
        this.visualizer = visualizer;
        this.p5Instance = p5Instance;
    }

    start(): void {
        if (this._isRunning) return;
        this._isRunning = true;
        this.loop();
    }

    stop(): void {
        this._isRunning = false;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    isRunning(): boolean {
        return this._isRunning;
    }

    private loop = () => {
        if (!this._isRunning) return;

        // 1. Get Data
        const inputData = this.source.getNextBuffer();

        // 2. Process
        const whitenedData = this.whitener.whitening(inputData);
        const snapshot = this.processor.compute(whitenedData);

        // 3. Draw
        this.visualizer.draw(this.p5Instance, snapshot);

        this.rafId = requestAnimationFrame(this.loop);
    }
}
