<template>
  <div class="tilt-control">
    <label>Spectral Tilt (Whitening): <span>{{ displayValue }}</span>%</label>
    <input 
      type="range" 
      min="0" 
      max="100" 
      v-model="sliderValue" 
      @input="updateTilt"
      style="width: 100%;"
    >
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { whitener } from '../logic/audioEngine';

const sliderValue = ref(60);

const displayValue = computed(() => sliderValue.value);

function updateTilt() {
  whitener.setAmount(sliderValue.value / 100);
}
</script>

<style scoped>
.tilt-control {
  color: white;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
</style>
