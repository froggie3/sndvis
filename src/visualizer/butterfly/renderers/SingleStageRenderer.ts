import { BaseButterflyRenderer } from './BaseButterflyRenderer.js';
import type { IRendererContext } from '../types.js';

export class SingleStageRenderer extends BaseButterflyRenderer {
    draw(ctx: IRendererContext): void {
        const { p, width, height, stages, config } = ctx;
        const N = stages[0].length;
        const { rotation, selectedStageIndex } = config;

        // Safety check
        if (selectedStageIndex < 0 || selectedStageIndex >= stages.length) return;

        // Apply Rotation Transform
        p.push();
        let canvasWidth = width;
        let canvasHeight = height;

        if (rotation === 90) {
            p.translate(width, 0);
            p.rotate(p.HALF_PI);
            canvasWidth = height;
            canvasHeight = width;
        } else if (rotation === 180) {
            p.translate(width, height);
            p.rotate(p.PI);
            canvasWidth = width;
            canvasHeight = height;
        } else if (rotation === 270) {
            p.translate(0, height);
            p.rotate(-p.HALF_PI);
            canvasWidth = height;
            canvasHeight = width;
        }

        const nodeStride = (canvasHeight - 2 * this.marginY) / (N - 1);
        const centerX = canvasWidth / 2;
        const getY = (nodeIndex: number) => this.marginY + nodeIndex * nodeStride;

        // Draw Nodes
        p.push();
        ctx.colorStrategy.setup(p, config);

        const s = selectedStageIndex;
        for (let i = 0; i < N; i++) {
            const y = getY(i);
            this.drawNode(p, s, i, centerX, y, ctx);
        }
        p.pop(); // Restore node style

        p.pop(); // Restore rotation

        // Labels
        p.fill(255);
        p.noStroke();

        let labelX = 0;
        let labelY = 0;
        let alignX: any = p.CENTER;
        let alignY: any = p.BOTTOM;

        if (rotation === 0) {
            labelX = width / 2;
            labelY = height - 15;
            alignX = p.CENTER;
            alignY = p.BOTTOM;
        } else if (rotation === 90) {
            labelX = 15;
            labelY = height / 2;
            alignX = p.LEFT;
            alignY = p.CENTER;
        } else if (rotation === 180) {
            labelX = width / 2;
            labelY = 15;
            alignX = p.CENTER;
            alignY = p.TOP;
        } else if (rotation === 270) {
            labelX = width - 15;
            labelY = height / 2;
            alignX = p.RIGHT;
            alignY = p.CENTER;
        }

        p.textAlign(alignX, alignY);
        p.text(`S${s}`, labelX, labelY);
    }
}
