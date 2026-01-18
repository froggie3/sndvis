/**
 * Driver interface for the visualization loop.
 * Matches architecture: "IRenderLoop"
 */
export interface IRenderLoop {
    start(): void;
    stop(): void;

    /**
     * Check if the loop is currently running.
     */
    isRunning(): boolean;
}
