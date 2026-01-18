<template>
  <div ref="canvasContainer" class="canvas-container"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import p5 from 'p5';
import { initAudio, visualizer } from '../logic/audioEngine';

const canvasContainer = ref<HTMLElement | null>(null);
let myp5: p5 | null = null;

onMounted(() => {
  if (!canvasContainer.value) return;

  const sketch = (p: p5) => {
    p.setup = async () => {
      p.createCanvas(p.windowWidth, p.windowHeight);
      p.noLoop(); // Driver manages loop
      
      visualizer.setup(p, p.width, p.height);
      
      // Init Global Audio Engine
      initAudio(p);
    };

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      visualizer.resize(p.width, p.height);
    };
  };

  myp5 = new p5(sketch, canvasContainer.value);
});

onUnmounted(() => {
  if (myp5) {
    myp5.remove();
  }
});
</script>

<style scoped>
.canvas-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #000;
}
</style>
