import type { IRenderLoop } from './IRenderLoop.js';
import type { IAudioSource } from './IAudioSource.js';
import { FileAudioSource } from './FileAudioSource.js';
import { FFTProcessor } from '../domain/fft-processor.js';
import { SpectralWhitener } from '../domain/spectral-whitener.js';
import type { IVisualizer } from '../visualizer/IVisualizer.js';
import p5 from 'p5';

// @ts-ignore
import WebMWriter from 'webm-writer';

export class OfflineExportLoop implements IRenderLoop {
    private source: FileAudioSource; // Must be file source
    private processor: FFTProcessor;
    private whitener: SpectralWhitener;
    private visualizer: IVisualizer;
    private p5Instance: p5;

    private _isRunning: boolean = false;
    private frameRate: number = 60;

    // Status Callbacks
    public onProgress?: (percent: number) => void;
    public onComplete?: (blob: Blob) => void;

    constructor(
        source: IAudioSource, // We check type inside
        processor: FFTProcessor,
        whitener: SpectralWhitener,
        visualizer: IVisualizer,
        p5Instance: p5
    ) {
        if (!(source instanceof FileAudioSource)) {
            throw new Error("Offline Export requires FileAudioSource");
        }
        this.source = source as FileAudioSource;
        this.processor = processor;
        this.whitener = whitener;
        this.visualizer = visualizer;
        this.p5Instance = p5Instance;
    }

    start(): void {
        if (this._isRunning) return;
        this._isRunning = true;

        // Start Async Export Process
        this.processExport();
    }

    stop(): void {
        // Cancel export if possible
        this._isRunning = false;
    }

    isRunning(): boolean {
        return this._isRunning;
    }

    private async processExport() {
        if (!this.source.getMetaInfo().duration) {
            alert("No audio loaded or unknown duration.");
            this._isRunning = false;
            return;
        }

        const duration = this.source.getMetaInfo().duration as number;
        const totalFrames = Math.ceil(duration * this.frameRate);
        const width = this.p5Instance.width;
        const height = this.p5Instance.height;

        // Initialize Writer
        const writer = new WebMWriter({
            quality: 0.95,
            frameRate: this.frameRate,
            width: width,
            height: height
        });

        // Loop
        for (let i = 0; i < totalFrames; i++) {
            if (!this._isRunning) break;

            const t = i / this.frameRate;

            // 1. Get Data at time t
            const data = this.source.getBufferAtTime(t);

            // 2. Compute
            const whitenedData = this.whitener.whitening(data);
            const snapshot = this.processor.compute(whitenedData);

            // 3. Draw
            // We can draw to the main canvas (p5Instance)
            this.visualizer.draw(this.p5Instance, snapshot);

            // 4. Add Frame
            // webm-writer accepts HTMLCanvasElement
            const canvas = (this.p5Instance as any).canvas; // p5 property
            writer.addFrame(canvas);

            // 5. Progress
            if (this.onProgress && i % 30 === 0) {
                this.onProgress(i / totalFrames);
                // Allow UI update
                await new Promise(r => setTimeout(r, 0));
            }
        }

        if (this._isRunning) {
            console.log("Export Finishing...");
            const blob = await writer.complete();
            console.log("Export Complete", blob);
            if (this.onComplete) this.onComplete(blob);
        }

        this._isRunning = false;
    }
}
