import { BaseButterflyRenderer } from './BaseButterflyRenderer.js';
import type { IRendererContext } from '../types.js';

export class MultiStageRenderer extends BaseButterflyRenderer {
    draw(ctx: IRendererContext): void {
        const { p, width, height, stages, config } = ctx;
        const numStages = stages.length;
        const N = stages[0].length;
        const { rotation } = config;

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
            p.rotate(-p.HALF_PI); // or 3*HALF_PI
            canvasWidth = height;
            canvasHeight = width;
        }

        const stageStride = (canvasWidth - 2 * this.marginX) / (numStages - 1);
        const nodeStride = (canvasHeight - 2 * this.marginY) / (N - 1);

        const getX = (stageIndex: number) => this.marginX + stageIndex * stageStride;
        const getY = (nodeIndex: number) => this.marginY + nodeIndex * nodeStride;

        // Draw connections (Butterflies)
        p.strokeWeight(1);
        p.noFill();
        for (let s = 0; s < numStages - 1; s++) {
            const butterflySize = 1 << (s + 1);
            const halfSize = butterflySize >> 1;

            const { h: hue, s: sat, l: lum } = config.butterflyLineColor;
            p.stroke(hue, sat, lum, 100);

            for (let i = 0; i < N; i += butterflySize) {
                for (let j = 0; j < halfSize; j++) {
                    const k = i + j;
                    const m = i + j + halfSize;
                    const x1 = getX(s);
                    const x2 = getX(s + 1);
                    const yk = getY(k);
                    const ym = getY(m);
                    p.line(x1, yk, x2, ym);
                    p.line(x1, ym, x2, yk);
                }
            }
        }

        // Draw Nodes
        p.push();
        ctx.colorStrategy.setup(p, config);

        for (let s = 0; s < numStages; s++) {
            const x = getX(s);
            for (let i = 0; i < N; i++) {
                const y = getY(i);
                this.drawNode(p, s, i, x, y, ctx);
            }
        }
        p.pop(); // Restore node style

        p.pop(); // Restore rotation

        // Labels
        this.drawLabels(ctx, getX);
    }

    private drawLabels(ctx: IRendererContext, getX: (s: number) => number) {
        const { p, width, height, config, stages } = ctx;
        const numStages = stages.length;
        const { rotation } = config;

        p.fill(255);
        p.noStroke();

        for (let stgIdx = 0; stgIdx < numStages; stgIdx++) {

            let labelX = 0;
            let labelY = 0;
            let alignX: any = p.CENTER;
            let alignY: any = p.BOTTOM;

            if (rotation === 0) {
                labelX = getX(stgIdx);
                labelY = height - 15;
                alignX = p.CENTER;
                alignY = p.BOTTOM;
            } else if (rotation === 90) {
                labelX = 15;
                labelY = getX(stgIdx);
                alignX = p.LEFT;
                alignY = p.CENTER;
            } else if (rotation === 180) {
                labelX = width - getX(stgIdx);
                labelY = 15;
                alignX = p.CENTER;
                alignY = p.TOP;
            } else if (rotation === 270) {
                labelX = width - 15;
                labelY = height - getX(stgIdx);
                alignX = p.RIGHT;
                alignY = p.CENTER;
            }

            p.textAlign(alignX, alignY);
            p.text(`S${stgIdx}`, labelX, labelY);
        }
    }
}
