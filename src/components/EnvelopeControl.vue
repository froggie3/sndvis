<template>
  <div class="control-panel">
    <strong>LED Response (ADSR)</strong>
    <select v-model="selectedPresetName" @change="onPresetChange" style="margin-bottom: 5px; width: 100%;">
      <option v-for="p in presets" :key="p.name" :value="p.name">{{ p.name }}</option>
      <option value="Custom">Custom</option>
    </select>

    <div class="slider-grid">
      <label>Attack</label>
      <input type="range" min="0" max="100" v-model="attack" @input="onCustomChange">
      <span>{{ (attack / 100).toFixed(2) }}</span>

      <label>Release</label>
      <input type="range" min="0" max="100" v-model="release" @input="onCustomChange">
      <span>{{ (release / 100).toFixed(2) }}</span>

      <label>Curve</label>
      <input type="range" min="0" max="300" v-model="curve" @input="onCustomChange">
      <span>{{ (curve / 100).toFixed(1) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { PRESETS } from '../domain/envelope-config';
import { setEnvelopeConfig } from '../logic/audioEngine';

const presets = PRESETS;
const selectedPresetName = ref("Neon (Exponential)"); // Default

const attack = ref(10);
const release = ref(95);
const curve = ref(200);

// Init with Neon using logic explicitly
const initialPreset = PRESETS.find(p => p.name === selectedPresetName.value);
if (initialPreset) {
    applyConfig(initialPreset);
}

function applyConfig(cfg: any) {
    attack.value = cfg.attackTime * 100;
    release.value = cfg.releaseTime * 100;
    curve.value = cfg.curveShape * 100;
    setEnvelopeConfig(cfg);
}

function onPresetChange() {
  const p = PRESETS.find(x => x.name === selectedPresetName.value);
  if (p) {
    applyConfig(p);
  }
}

function onCustomChange() {
  selectedPresetName.value = "Custom";
  setEnvelopeConfig({
    attackTime: attack.value / 100,
    releaseTime: release.value / 100,
    curveShape: curve.value / 100
  });
}
</script>

<style scoped>
.control-panel {
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 10px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.slider-grid {
  display: grid;
  grid-template-columns: 60px 1fr 40px;
  gap: 5px;
  align-items: center;
}
</style>
