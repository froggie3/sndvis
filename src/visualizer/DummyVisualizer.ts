import type p5 from 'p5';
import type { FFTSnapshot } from '../domain/types';
import type { IVisualizer } from './IVisualizer';

export class DummyVisualizer implements IVisualizer {
    private width: number = 0;
    private height: number = 0;

    setup(_p: p5, width: number, height: number): void {
        this.width = width;
        this.height = height;
    }

    draw(p: p5, snapshot: FFTSnapshot): void {
        p.background(0);
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(32);
        p.text("Dummy Visualizer", this.width / 2, this.height / 2);

        p.textSize(16);
        p.text(`FFT Stages: ${snapshot.stages.length}`, this.width / 2, this.height / 2 + 40);
    }

    resize(width: number, height: number): void {
        this.width = width;
        this.height = height;
    }

    setConfig(_config: any): void {
        // No-op for dummy
    }
}
