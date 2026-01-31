<template>
  <div class="visualizer-selector">
    <div class="selector-content">
      <h3>Select Visualizer</h3>
      <div 
        v-for="name in visualizers" 
        :key="name" 
        class="viz-option"
        :class="{ active: currentName === name }"
        @click="selectVisualizer(name)"
      >
        {{ name }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { visualizerManager } from '../logic/audioEngine';

const visualizers = visualizerManager.getAvailableVisualizers();
const currentName = computed(() => visualizerManager.state.currentName);

function selectVisualizer(name: string) {
  visualizerManager.switchTo(name);
}
</script>

<style scoped>
.visualizer-selector {
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  min-width: 250px;
  text-align: center;
  color: white;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
}

h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.1em;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.viz-option {
  padding: 10px 15px;
  margin: 5px 0;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(100, 180, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1em;
}

.viz-option:hover {
  background: rgba(255, 255, 255, 0.15);
}

.viz-option.active {
  background: rgba(100, 180, 255, 0.3);
  border: 1px solid rgba(100, 180, 255, 0.5);
  color: #fff;
}
</style>
