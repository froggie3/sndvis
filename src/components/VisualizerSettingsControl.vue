<template>
  <div class="control-panel">
    <strong>Visualizer Settings</strong>
    <select v-model="selectedPresetName" @change="onPresetChange" style="margin-bottom: 5px; width: 100%;">
      <option v-for="p in presets" :key="p.name" :value="p.name">{{ p.name }}</option>
      <option value="Custom">Custom</option>
    </select>

    <div class="section-label">Size</div>
    <div class="slider-grid">
      <label>Min</label><input type="range" min="0" max="20" v-model.number="cfg.minSize" @input="onCustomChange"><span>{{ cfg.minSize }}</span>
      <label>Max</label><input type="range" min="5" max="100" v-model.number="cfg.maxSize" @input="onCustomChange"><span>{{ cfg.maxSize }}</span>
      <label>Scale</label><input type="range" min="1" max="50" v-model.number="cfg.sizeScale" @input="onCustomChange"><span>{{ cfg.sizeScale }}</span>
    </div>

    <div class="section-label">Color</div>
    <div class="row">
        <label>Mode:</label>
        <select v-model="cfg.colorMode" @change="onCustomChange">
            <option value="BrightnessMap">Brightness</option>
            <option value="PhaseHue">Phase Hue</option>
            <option value="FreqGradient_PhaseBrightness">Freq Gradient</option>
        </select>
    </div>

    <!-- Mode: BrightnessMap -->
    <div v-if="cfg.colorMode === 'BrightnessMap'" class="slider-grid group">
         <label>Red</label><input type="range" min="0" max="255" v-model.number="cfg.brightnessR" @input="onCustomChange"><span>{{ cfg.brightnessR }}</span>
         <label>Blue</label><input type="range" min="0" max="255" v-model.number="cfg.brightnessB" @input="onCustomChange"><span>{{ cfg.brightnessB }}</span>
         <label>G-Scale</label><input type="range" min="0" max="255" v-model.number="cfg.brightnessGScale" @input="onCustomChange"><span>{{ cfg.brightnessGScale }}</span>
    </div>

    <!-- Mode: Saturation Shared -->
    <div v-if="cfg.colorMode === 'PhaseHue' || cfg.colorMode === 'FreqGradient_PhaseBrightness'" class="slider-grid group">
        <label>Sat</label><input type="range" min="0" max="100" v-model.number="cfg.hueSaturation" @input="onCustomChange"><span>{{ cfg.hueSaturation }}</span>
    </div>

    <!-- Mode: Hue -->
    <div v-if="cfg.colorMode === 'PhaseHue'" class="slider-grid group">
        <label>Offset</label><input type="range" min="0" max="360" v-model.number="cfg.hueOffset" @input="onCustomChange"><span>{{ cfg.hueOffset }}°</span>
        <label>Range</label><input type="range" min="-1" max="1" step="0.01" v-model.number="cfg.hueRangeRatio" @input="onCustomChange"><span>{{ cfg.hueRangeRatio }}</span>
        <label>BriScale</label><input type="range" min="0" max="255" v-model.number="cfg.hueBrightnessScale" @input="onCustomChange"><span>{{ cfg.hueBrightnessScale }}</span>
        
        <div class="range-display" style="grid-column: 1 / span 3; color: #aaa; font-size: 0.8em; margin-top: 4px;">
          Map: {{ hueRangeText }}
        </div>
    </div>

    <!-- Mode: Freq -->
    <div v-if="cfg.colorMode === 'FreqGradient_PhaseBrightness'" class="slider-grid group">
        <label>StartHue</label><input type="range" min="0" max="360" v-model.number="cfg.freqHueStart" @input="onCustomChange"><span>{{ cfg.freqHueStart }}</span>
        <label>EndHue</label><input type="range" min="0" max="360" v-model.number="cfg.freqHueEnd" @input="onCustomChange"><span>{{ cfg.freqHueEnd }}</span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { VIZ_PRESETS, type ButterflyVisualizerConfig } from '../visualizer/config';
import { setVisualizerConfig } from '../logic/audioEngine';

const presets = VIZ_PRESETS;
const selectedPresetName = ref(VIZ_PRESETS[0].name);

const cfg = reactive<ButterflyVisualizerConfig>({ ...VIZ_PRESETS[0] });

function onPresetChange() {
    const p = VIZ_PRESETS.find(x => x.name === selectedPresetName.value);
    if (p) {
        Object.assign(cfg, p);
        setVisualizerConfig(p);
    }
}

function onCustomChange() {
    selectedPresetName.value = "Custom";
    setVisualizerConfig({ ...cfg, name: 'Custom' });
}

const hueRangeText = computed(() => {
    const start = ((cfg.hueOffset % 360) + 360) % 360;
    const range = cfg.hueRangeRatio * 360;
    const endRaw = cfg.hueOffset + range;
    const end = ((endRaw % 360) + 360) % 360;

    // Distinguish between 0 range and 360 range when start equals end
    if (start === end && Math.abs(cfg.hueRangeRatio) >= 1) {
        const sign = cfg.hueRangeRatio > 0 ? "" : "-";
        return `${start.toFixed(0)}° ～ ${sign}360°`;
    }
    
    // For ratio 0, just show a single value
    if (cfg.hueRangeRatio === 0) {
        return `${start.toFixed(0)}°`;
    }

    return `${start.toFixed(0)}° ～ ${end.toFixed(0)}°`;
});

// Ensure init state helps engine (though engine defaults might match)
setVisualizerConfig(cfg);

</script>

<style scoped>
.control-panel {
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  color: white;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  width: 300px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}



.section-label {
    font-size: 0.85em; 
    margin: 5px 0;
    color: #ccc;
}

.slider-grid {
  display: grid;
  grid-template-columns: 60px 1fr 40px;
  gap: 5px;
  align-items: center;
}

.row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 5px;
}

.group {
    margin-top: 5px;
    padding-top: 5px;
    border-top: 1px solid rgba(255,255,255,0.1);
}
</style>
