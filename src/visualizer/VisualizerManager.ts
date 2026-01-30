import type p5 from 'p5';
import type { FFTSnapshot } from '../domain/types';
import type { IVisualizer } from './IVisualizer';
import { reactive } from 'vue';

export class VisualizerManager implements IVisualizer {
    private visualizers: Map<string, IVisualizer> = new Map();
    private activeVisualizerName: string = '';

    // Reactive state for UI
    public state = reactive({
        currentName: ''
    });

    // Cache current instance for performance in loop
    private currentVisualizer: IVisualizer | null = null;

    // Methods to manage execution context
    private p: p5 | null = null;
    private width: number = 0;
    private height: number = 0;

    register(name: string, visualizer: IVisualizer) {
        this.visualizers.set(name, visualizer);
        if (!this.activeVisualizerName) {
            this.activeVisualizerName = name;
            this.state.currentName = name;
            this.currentVisualizer = visualizer;
        }
    }

    getAvailableVisualizers(): string[] {
        return Array.from(this.visualizers.keys());
    }

    get(name: string): IVisualizer | undefined {
        return this.visualizers.get(name);
    }

    switchTo(name: string) {
        if (this.visualizers.has(name)) {
            this.activeVisualizerName = name;
            this.state.currentName = name;
            this.currentVisualizer = this.visualizers.get(name)!;

            // Re-setup the new visualizer if we have context
            if (this.p) {
                this.currentVisualizer.setup(this.p, this.width, this.height);
            }
        } else {
            console.warn(`Visualizer ${name} not found.`);
        }
    }

    // --- IVisualizer Implementation largely delegated ---

    setup(p: p5, width: number, height: number): void {
        this.p = p;
        this.width = width;
        this.height = height;
        if (this.currentVisualizer) {
            this.currentVisualizer.setup(p, width, height);
        }
    }

    draw(p: p5, snapshot: FFTSnapshot): void {
        if (this.currentVisualizer) {
            this.currentVisualizer.draw(p, snapshot);
        }
    }

    resize(width: number, height: number): void {
        this.width = width;
        this.height = height;
        if (this.currentVisualizer) {
            this.currentVisualizer.resize(width, height);
        }
    }

    setConfig(config: any): void {
        // Broadcast config or just set to current?
        // Usually, the App pushes Envelope Config to "current".
        if (this.currentVisualizer) {
            this.currentVisualizer.setConfig(config);
        }
    }
}
