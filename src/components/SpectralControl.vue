<template>
  <div class="tilt-control">
    <div class="row">
      <label>FFT Size: </label>
      <input 
          type="range" 
          :min="MIN_FFT_EXPONENT" 
          :max="MAX_FFT_EXPONENT" 
          :value="Math.log2(appState.fftSize)" 
          @input="onFftSizeChange"
      >
      <span class="value-label">{{ appState.fftSize }}</span>
    </div>

    <div class="row">
      <label>Spectral Tilt: <span>{{ displayValue }}</span>%</label>
      <input 
        type="range" 
        min="0" 
        max="100" 
        v-model="sliderValue" 
        @input="updateTilt"
        style="width: 100%;"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { appState, whitener, updateFFTSize } from '../logic/audioEngine';
import { MIN_FFT_EXPONENT, MAX_FFT_EXPONENT } from '../domain/constants';

const sliderValue = ref(60);

const displayValue = computed(() => sliderValue.value);

function updateTilt() {
  whitener.setAmount(sliderValue.value / 100);
}

function onFftSizeChange(e: Event) {
    const exponent = parseInt((e.target as HTMLInputElement).value);
    const newSize = Math.pow(2, exponent);
    updateFFTSize(newSize);
}
</script>

<style scoped>
.tilt-control {
  color: white;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.value-label {
  align-self: flex-start;
  font-family: monospace;
  background: rgba(255,255,255,0.1);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}
</style>
