<template>
  <div class="transfer-function-editor control-panel">
    <div class="header">
      <strong>Transfer Function</strong>
      <select :value="modelValue.type" @change="updateType">
        <option value="power">Power</option>
        <option value="sigmoid">Sigmoid</option>
        <option value="sine">Sine</option>
        <option value="step">Step</option>
      </select>
    </div>

    <div class="preview-container" ref="canvasContainer">
      <!-- p5.js canvas will be injected here -->
    </div>

    <div class="slider-grid">
      <label title="Output value at input=0">P0 (Start)</label>
      <input type="range" min="-100" max="100" :value="modelValue.p0 * 100" @input="updateP0">
      <span>{{ modelValue.p0.toFixed(2) }}</span>

      <label title="Output value at input=1">P1 (End)</label>
      <input type="range" min="-100" max="100" :value="modelValue.p1 * 100" @input="updateP1">
      <span>{{ modelValue.p1.toFixed(2) }}</span>

      <label title="Curve bias/intensity">P2 (Bias)</label>
      <input type="range" min="-100" max="100" :value="modelValue.p2 * 100" @input="updateP2">
      <span>{{ modelValue.p2.toFixed(2) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import p5 from 'p5';
import { calculateTransferFunction } from '../domain/transfer-function';
import type { TransferFunctionConfig, CurveType } from '../domain/transfer-function';

interface Props {
  modelValue: TransferFunctionConfig;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue']);

const canvasContainer = ref<HTMLElement | null>(null);
let p5Instance: p5 | null = null;

const updateType = (e: Event) => {
  const type = (e.target as HTMLSelectElement).value as CurveType;
  emit('update:modelValue', { ...props.modelValue, type });
};

const updateP0 = (e: Event) => {
  const p0 = parseInt((e.target as HTMLInputElement).value) / 100;
  emit('update:modelValue', { ...props.modelValue, p0 });
};

const updateP1 = (e: Event) => {
  const p1 = parseInt((e.target as HTMLInputElement).value) / 100;
  emit('update:modelValue', { ...props.modelValue, p1 });
};

const updateP2 = (e: Event) => {
  const p2 = parseInt((e.target as HTMLInputElement).value) / 100;
  emit('update:modelValue', { ...props.modelValue, p2 });
};

const initP5 = () => {
  if (!canvasContainer.value) return;

  const sketch = (p: p5) => {
    p.setup = () => {
      const container = canvasContainer.value!;
      const canvas = p.createCanvas(container.clientWidth, 150);
      canvas.parent(container);
    };

    p.draw = () => {
      p.clear(0, 0, 0, 0);
      p.background(20, 20, 25, 150);
      
      const w = p.width;
      const h = p.height;
      const margin = 10;
      const innerW = w - margin * 2;
      const innerH = h - margin * 2;

      // Draw grid
      p.stroke(255, 255, 255, 30);
      p.line(margin, margin + innerH / 2, margin + innerW, margin + innerH / 2);
      p.line(margin + innerW / 2, margin, margin + innerW / 2, margin + innerH);

      // Draw axes
      p.stroke(255, 255, 255, 50);
      p.noFill();
      p.rect(margin, margin, innerW, innerH);

      // Draw curve
      p.noFill();
      p.strokeJoin(p.ROUND);
      p.stroke(0, 200, 255);
      p.strokeWeight(2);
      
      p.beginShape();
      for (let i = 0; i <= innerW; i++) {
        const t = i / innerW;
        // Using calculateTransferFunction for preview
        // Note: calculateTransferFunction(v, inMin, inMax, config)
        const yVal = calculateTransferFunction(t, 0, 1, props.modelValue);
        
        // Map yVal [-1, 1] to [margin + innerH, margin]
        const yPos = p.map(yVal, -1, 1, margin + innerH, margin);
        p.vertex(margin + i, yPos);
      }
      p.endShape();

      // Draw endpoints
      p.fill(255, 0, 100);
      p.noStroke();
      const p0Y = p.map(props.modelValue.p0, -1, 1, margin + innerH, margin);
      const p1Y = p.map(props.modelValue.p1, -1, 1, margin + innerH, margin);
      p.circle(margin, p0Y, 6);
      p.circle(margin + innerW, p1Y, 6);
    };

    p.windowResized = () => {
      if (canvasContainer.value) {
        p.resizeCanvas(canvasContainer.value.clientWidth, 150);
      }
    };
  };

  p5Instance = new p5(sketch);
};

onMounted(() => {
  initP5();
});

onUnmounted(() => {
  if (p5Instance) {
    p5Instance.remove();
  }
});
</script>

<style scoped>
.control-panel {
  background: rgba(30, 30, 40, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 15px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

select {
  background: rgba(0, 0, 0, 0.4);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
  outline: none;
}

.preview-container {
  width: 100%;
  height: 150px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  overflow: hidden;
}

.slider-grid {
  display: grid;
  grid-template-columns: 80px 1fr 45px;
  gap: 8px;
  align-items: center;
  font-size: 0.9em;
}

input[type="range"] {
  accent-color: #00c8ff;
}

span {
  text-align: right;
  font-family: monospace;
  color: #00c8ff;
}
</style>
