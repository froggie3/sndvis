<template>
  <div class="control-panel">
    <strong>Visualizer Settings</strong>
    
    <div v-if="currentVizName === 'Dummy'" class="dummy-msg">
        No settings available for Dummy Visualizer.
    </div>

    <!-- Butterfly Controls (Multi or Single) -->
    <template v-else-if="currentVizName.includes('Butterfly')">
        <select v-model="selectedPresetName" @change="onPresetChange" style="margin-bottom: 5px; width: 100%;">
        <option v-for="p in presets" :key="p.name" :value="p.name">{{ p.name }}</option>
        <option value="Custom">Custom</option>
        </select>

        <div class="section-label">Size</div>
        <div class="slider-grid">
        <label>Min</label><input type="range" min="0" max="20" v-model.number="cfg.minSize" @input="onCustomChange"><span>{{ cfg.minSize }}</span>
        <label>Max</label><input type="range" min="5" max="100" v-model.number="cfg.maxSize" @input="onCustomChange"><span>{{ cfg.maxSize }}</span>
        <label>Scale</label><input type="range" min="1" max="200" v-model.number="cfg.sizeScale" @input="onCustomChange"><span>{{ cfg.sizeScale }}</span>
        </div>

        <div class="section-label">Color</div>
        <div class="row">
            <label>Mode:</label>
            <select v-model="cfg.colorMode" @change="onCustomChange">
                <option value="PhaseHue">Phase Hue</option>
                <option value="FreqGradient_PhaseBrightness">Freq Gradient</option>
            </select>
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

        <div class="section-label">Signal Normalization</div>
        <div class="row" style="flex-wrap: wrap;">
            <label>Mode:</label>
            <select v-model="cfg.normalizationMode" @change="onCustomChange">
                <option value="NONE">None (Raw)</option>
                <option value="LOG">Logarithmic</option>
            </select>
            
            <div v-if="cfg.normalizationMode === 'LOG'" style="display:inline-flex; align-items:center; gap:5px; margin-left: 10px;">
            <label>Base:</label>
            <input type="number" v-model.number="cfg.logBase" min="2" max="100" style="width: 50px;" @input="onCustomChange">
            </div>
        </div>

        <div class="section-label">Fractal Scaling</div>
        <div class="row">
            <label><input type="checkbox" v-model="cfg.useFractalSize" @change="onCustomChange"> Enabled</label>
        </div>
        <div v-if="cfg.useFractalSize" class="slider-grid group">
            <label>Decay</label>
            <input type="range" min="0.5" max="1.2" step="0.01" v-model.number="cfg.fractalDecay" @input="onCustomChange">
            <span>{{ cfg.fractalDecay }}</span>
        </div>

        <div class="section-label group">View</div>
        <div class="row">
            <label style="width: 60px;">Rotate:</label>
            <label><input type="radio" :value="0" v-model="cfg.rotation" @change="onCustomChange"> 0°</label>
            <label><input type="radio" :value="90" v-model="cfg.rotation" @change="onCustomChange"> 90°</label>
            <label><input type="radio" :value="180" v-model="cfg.rotation" @change="onCustomChange"> 180°</label>
            <label><input type="radio" :value="270" v-model="cfg.rotation" @change="onCustomChange"> 270°</label>
        </div>
        
        <!-- Stage Separation - Logic based on Single/Multi -->
        <div class="section-label" v-if="showStageControls">Stage Separation</div>
        <div class="stage-grid" v-if="showStageControls">
            <!-- Allow 'All' only if we permit it or we are in Multi Mode? User request was separate visualizers. -->
            <!-- If in 'Butterfly (Multi)', we basically enforce All (-1). -->
            <!-- If in 'Butterfly (Single)', we enforce Some (>=0). -->
            
            <!-- Let's show All option only if Multi Mode -->
            <label class="stage-item" v-if="isMultiMode">
                <input type="radio" :value="-1" v-model="cfg.selectedStageIndex" @change="onCustomChange"> All
            </label>
            
            <!-- Show individual stages only if Single Mode OR (maybe we allow selecting single in multi mode? user said: 'Separate visualizers') -->
            <!-- Let's strictly separate: Multi -> All only. Single -> S0..Sn only. -->
            <template v-if="isSingleMode">
                <label v-for="s in availableStages" :key="s" class="stage-item">
                    <input type="radio" :value="s" v-model="cfg.selectedStageIndex" @change="onCustomChange"> S{{ s }}
                </label>
            </template>
        </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { VIZ_PRESETS, type ButterflyVisualizerConfig } from '../visualizer/config';
import { setVisualizerConfig, appState, visualizerManager } from '../logic/audioEngine';

const currentVizName = computed(() => visualizerManager.state.currentName);
const isMultiMode = computed(() => currentVizName.value.includes('(Multi)'));
const isSingleMode = computed(() => currentVizName.value.includes('(Single)'));

const showStageControls = computed(() => isMultiMode.value || isSingleMode.value);

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

// Dynamic Stages
const availableStages = computed(() => {
    // FFT Size -> Stages
    // log2(128) = 7. Total stages = 7 + 1 = 8. (0..7)
    const log2 = Math.log2(appState.fftSize);
    const count = Math.floor(log2) + 1; // Corrected count
    return Array.from({ length: count }, (_, i) => i);
});

// Watch for FFT size changes to reset selection if out of bounds
watch(() => appState.fftSize, (newSize) => {
    const maxIndex = Math.floor(Math.log2(newSize)); 
    if (cfg.selectedStageIndex > maxIndex) {
        // If out of bounds, clamp to maxIndex.
        // For Multi, -1 is fine.
        if (cfg.selectedStageIndex !== -1) {
            cfg.selectedStageIndex = maxIndex;
            setVisualizerConfig(cfg);
        }
    }
});

// Watch for visualizer switch to re-sync config?
// The config object 'cfg' here is local. If the audio engine has separate instances,
// switching visualizer means 'setVisualizerConfig' will apply to the NEW one, but we are using 'cfg' values.
// Ideally, when we switch, we should load settings FROM the new visualizer.
// Since 'ButterflyVisualizer' has getSettings(), we can pull it.
// But we need to know WHEN it switches.
watch(currentVizName, () => {
    // Reload config from active visualizer if possible
    const current = visualizerManager.get(currentVizName.value);
    // TypeScript check for ButterflyVisualizer...
    // We can assume if name includes Butterfly, it matches.
    if (current && 'getSettings' in current) {
         const newCfg = (current as any).getSettings();
         Object.assign(cfg, newCfg);
         // Also update preset selection name?
         // If it matches a preset, technically. But for now just sync values.
         selectedPresetName.value = newCfg.name || 'Custom';
    }
    
    // Enforce constraints
    if (isMultiMode.value && cfg.selectedStageIndex !== -1) {
        cfg.selectedStageIndex = -1;
        setVisualizerConfig(cfg);
    } else if (isSingleMode.value && cfg.selectedStageIndex === -1) {
        cfg.selectedStageIndex = 0;
        setVisualizerConfig(cfg);
    }
});

</script>

<style scoped>
.control-panel {
  color: white; /* Removed background/padding duplicates if handled by App, but kept for standalone usage safety? No, App.vue has .control-block. VisualizerSettingsControl uses .control-panel. I will trust App.vue styles or sync them. For now, removing the problematic width/overflow. */
  /* Remove fixed width and let App.vue handle it, OR set 100% to fill container */
  /* User requested 15rem total width. I will handle that in App.vue for all panels. */
  display: flex;
  flex-direction: column;
  /* Removed box-shadow, width, max-height, overflow-y */
}

/* ... existing styles ... */

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

.stage-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.stage-item {
    font-size: 0.9em;
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
}

.dummy-msg {
    padding: 20px;
    text-align: center;
    color: #888;
    background: rgba(255,255,255,0.05);
    border-radius: 8px;
}
</style>
