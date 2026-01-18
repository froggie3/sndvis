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
        // p5 draw() is usually called by p5's internal loop. 
        // Ideally, we should unify them.
        // OPTION A: Use p5's draw() as the main loop. 
        // OPTION B: Use this RAF as the main loop and call visualizer.draw() manually.
        // Since we are using p5 in instance mode, we can disable p5's auto-loop (noLoop()) 
        // and call redraw() or just draw directly if possible?
        // Actually, p5 "draw" is special. 

        // BETTER APPROACH for Realtime:
        // Let p5 Handle the loop via `p.draw`.
        // In `p.draw`, we ask the Driver "Give me the current state to draw".
        // BUT, we defined "Driver" as the one controlling the loop.

        // Let's compromise: 
        // RealtimeLoop will NOT use RAF. instead, it provides an `update()` method 
        // that p5 calls every frame.
        // AND, for the "Offline" later, the OfflineLoop will control the flow.

        // WAIT, the Architecture says:
        // "RealtimeLoop: requestAnimationFrame using system clock"

        // Let's stick to the architecture. RealtimeLoop drives the logic.
        // But p5 has its own clearing/setup.
        // We can just call `this.visualizer.draw(this.p5Instance, snapshot)` here.
        // and in p5 sketch, we put `p.noLoop()`.

        this.visualizer.draw(this.p5Instance, snapshot);

        this.rafId = requestAnimationFrame(this.loop);
    }
}
