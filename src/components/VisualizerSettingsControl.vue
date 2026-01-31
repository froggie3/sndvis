<template>
  <div class="control-panel">
    <strong>Visualizer Settings</strong>
    
    <div class="section-label">Common</div>
    <div class="slider-grid">
         <label>BG H</label><input type="range" min="0" max="360" v-model.number="colorCfg.backgroundColor.h" @input="onColorChange"><span>{{ colorCfg.backgroundColor.h }}</span>
         <label>BG S</label><input type="range" min="0" max="100" v-model.number="colorCfg.backgroundColor.s" @input="onColorChange"><span>{{ colorCfg.backgroundColor.s }}</span>
         <label>BG L</label><input type="range" min="0" max="100" v-model.number="colorCfg.backgroundColor.l" @input="onColorChange"><span>{{ colorCfg.backgroundColor.l }}</span>
    </div>

    <div v-if="isFinalStageMode" class="group" style="padding-top: 5px;">
        <select v-model="selectedGenericPresetName" @change="onGenericPresetChange" style="margin-bottom: 5px; width: 100%;">
            <option v-for="p in finalStagePresets" :key="p.name" :value="p.name">{{ p.name }}</option>
            <option value="Custom">Custom</option>
        </select>

        <div class="section-label">Display Mode</div>
        <div class="row">
             <label><input type="radio" value="REAL" v-model="finalCfg.showMode" @change="onFinalCustomChange"> Real</label>
             <label><input type="radio" value="IMAG" v-model="finalCfg.showMode" @change="onFinalCustomChange"> Imag</label>
             <label><input type="radio" value="BOTH" v-model="finalCfg.showMode" @change="onFinalCustomChange"> Both</label>
        </div>

        <div class="section-label">Scaling Mode</div>
        <div class="row">
            <select v-model="finalCfg.scaleMode" @change="onFinalCustomChange">
                <option value="LINEAR">Linear</option>
                <option value="LOG">Logarithmic</option>
                <option value="MEL">Mel Scale</option>
                <option value="CUSTOM">Custom (Exp)</option>
            </select>
            <button class="tiny-btn" @click="editCurve('freqToXStrategy', 'Frequency Layout')">Curve</button>
        </div>
        <div v-if="finalCfg.scaleMode === 'CUSTOM'" class="row">
             <label>Exp:</label>
             <input type="number" step="0.1" v-model.number="finalCfg.customExponent" @change="onFinalCustomChange" style="width: 50px;">
        </div>

        <div class="section-label">Appearance</div>
        <div class="slider-grid">
             <label>Min</label><input type="range" min="0" max="20" v-model.number="finalCfg.minSize" @input="onFinalCustomChange"><span>{{ finalCfg.minSize }}</span>
             <label>Max</label><input type="range" min="5" max="100" v-model.number="finalCfg.maxSize" @input="onFinalCustomChange"><span>{{ finalCfg.maxSize }}</span>
             <label>Scale</label><input type="range" min="0.1" max="5.0" step="0.1" v-model.number="finalCfg.sizeScale" @input="onFinalCustomChange"><span>{{ finalCfg.sizeScale }}</span>
             <div></div><button class="tiny-btn" @click="editCurve('magToSizeStrategy', 'Magnitude -> Size')" style="grid-column: span 2;">Size Curve</button>
        </div>
        
        <div class="row" style="margin-top: 5px;">
             <!-- Removed showFrequencyLabels checkbox as it is now implicit/grid -->
        </div>

        <div class="section-label">Color</div>
        <div class="row">
            <label>Mode:</label>
            <select v-model="finalCfg.colorMode" @change="onFinalCustomChange">
                <option value="PhaseHue">Phase Hue</option>
                <option value="FreqGradient_PhaseBrightness">Freq Gradient</option>
            </select>
        </div>

        <!-- Mode: Saturation Shared -->
        <div v-if="finalCfg.colorMode === 'PhaseHue' || finalCfg.colorMode === 'FreqGradient_PhaseBrightness'" class="slider-grid group">
            <label>Sat</label><input type="range" min="0" max="100" v-model.number="finalCfg.hueSaturation" @input="onFinalCustomChange"><span>{{ finalCfg.hueSaturation }}</span>
        </div>

        <!-- Mode: Hue -->
        <div v-if="finalCfg.colorMode === 'PhaseHue'" class="slider-grid group">
            <label>Offset</label><input type="range" min="0" max="360" v-model.number="finalCfg.hueOffset" @input="onFinalCustomChange"><span>{{ finalCfg.hueOffset }}°</span>
            <label>Range</label><input type="range" min="-1" max="1" step="0.01" v-model.number="finalCfg.hueRangeRatio" @input="onFinalCustomChange"><span>{{ finalCfg.hueRangeRatio }}</span>
            <label>Lightness</label><input type="range" min="0" max="100" v-model.number="finalCfg.hueLightnessScale" @input="onFinalCustomChange"><span>{{ finalCfg.hueLightnessScale }}</span>
            <div></div><button class="tiny-btn" @click="editCurve('phaseToHueStrategy', 'Phase -> Hue')" style="grid-column: span 2;">Hue Curve</button>
            <div></div><button class="tiny-btn" @click="editCurve('adsrToLightnessStrategy', 'ADSR -> Lightness')" style="grid-column: span 2;">Lightness Curve</button>
        </div>

        <!-- Mode: Freq -->
        <div v-if="finalCfg.colorMode === 'FreqGradient_PhaseBrightness'" class="slider-grid group">
            <label>StartHue</label><input type="range" min="0" max="360" v-model.number="finalCfg.freqHueStart" @input="onFinalCustomChange"><span>{{ finalCfg.freqHueStart }}</span>
            <label>EndHue</label><input type="range" min="0" max="360" v-model.number="finalCfg.freqHueEnd" @input="onFinalCustomChange"><span>{{ finalCfg.freqHueEnd }}</span>
            <div></div><button class="tiny-btn" @click="editCurve('freqToHueStrategy', 'Freq -> Hue Gradient')" style="grid-column: span 2;">Gradient Curve</button>
        </div>

        <div class="section-label group">Grid Color</div>
        <div class="slider-grid">
             <label>H</label><input type="range" min="0" max="360" v-model.number="finalCfg.gridColor.h" @input="onFinalCustomChange"><span>{{ finalCfg.gridColor.h }}</span>
             <label>S</label><input type="range" min="0" max="100" v-model.number="finalCfg.gridColor.s" @input="onFinalCustomChange"><span>{{ finalCfg.gridColor.s }}</span>
             <label>L</label><input type="range" min="0" max="100" v-model.number="finalCfg.gridColor.l" @input="onFinalCustomChange"><span>{{ finalCfg.gridColor.l }}</span>
        </div>
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
        <div></div><button class="tiny-btn" @click="editCurve('magToSizeStrategy', 'Magnitude -> Size')" style="grid-column: span 2;">Size Curve</button>
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
            <label>LScale</label><input type="range" min="0" max="100" v-model.number="cfg.hueLightnessScale" @input="onCustomChange"><span>{{ cfg.hueLightnessScale }}</span>
            <div class="range-display" style="grid-column: 1 / span 3; color: #aaa; font-size: 0.8em; margin-top: 4px;">
            Map: {{ hueRangeText }}
            </div>
            <div></div><button class="tiny-btn" @click="editCurve('phaseToHueStrategy', 'Phase -> Hue')" style="grid-column: span 2;">Hue Curve</button>
            <div></div><button class="tiny-btn" @click="editCurve('adsrToLightnessStrategy', 'ADSR -> Lightness')" style="grid-column: span 2;">Lightness Curve</button>
        </div>

        <!-- Mode: Freq -->
        <div v-if="cfg.colorMode === 'FreqGradient_PhaseBrightness'" class="slider-grid group">
            <label>StartHue</label><input type="range" min="0" max="360" v-model.number="cfg.freqHueStart" @input="onCustomChange"><span>{{ cfg.freqHueStart }}</span>
            <label>EndHue</label><input type="range" min="0" max="360" v-model.number="cfg.freqHueEnd" @input="onCustomChange"><span>{{ cfg.freqHueEnd }}</span>
            <div></div><button class="tiny-btn" @click="editCurve('freqToHueStrategy', 'Freq -> Hue Gradient')" style="grid-column: span 2;">Gradient Curve</button>
        </div>

        <div v-if="isMultiMode" class="section-label group">Butterfly Line Color</div>
        <div v-if="isMultiMode" class="slider-grid">
             <label>H</label><input type="range" min="0" max="360" v-model.number="cfg.butterflyLineColor.h" @input="onCustomChange"><span>{{ cfg.butterflyLineColor.h }}</span>
             <label>S</label><input type="range" min="0" max="100" v-model.number="cfg.butterflyLineColor.s" @input="onCustomChange"><span>{{ cfg.butterflyLineColor.s }}</span>
             <label>L</label><input type="range" min="0" max="100" v-model.number="cfg.butterflyLineColor.l" @input="onCustomChange"><span>{{ cfg.butterflyLineColor.l }}</span>
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
            <button class="tiny-btn" @click="editCurve('magNormStrategy', 'Magnitude Normalization')">Curve</button>
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

    <!-- Modal for Curve Editing -->
    <div v-if="editingConfigKey" class="tf-modal-overlay">
        <div class="tf-modal">
            <div class="tf-header">
                <strong>{{ editingConfigTitle }}</strong>
                <button class="close-btn" @click="closeCurveEditor">Close</button>
            </div>
            <div class="tf-body">
                <TransferFunctionEditor 
                    v-if="currentEditingConfig"
                    :modelValue="currentEditingConfig"
                    @update:modelValue="updateCurveConfig" 
                />
            </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { VIZ_PRESETS, type ButterflyVisualizerConfig, FINAL_STAGE_PRESETS, type FinalStageVisualizerConfig, type ColorCapableConfig } from '../visualizer/config';
import { setVisualizerConfig, appState, visualizerManager } from '../logic/audioEngine';
import TransferFunctionEditor from './TransferFunctionEditor.vue';
import type { TransferFunctionConfig } from '../domain/transfer-function';

const currentVizName = computed(() => visualizerManager.state.currentName);
const isMultiMode = computed(() => currentVizName.value.includes('(Multi)'));
const isSingleMode = computed(() => currentVizName.value.includes('(Single)'));
const isFinalStageMode = computed(() => currentVizName.value.includes('Spectrum'));

const colorCfg = computed<ColorCapableConfig>(() => {
    if (isFinalStageMode.value) return finalCfg;
    return cfg;
});

function onColorChange() {
    if (isFinalStageMode.value) onFinalCustomChange();
    else onCustomChange();
}

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

// Final Stage Logic
const finalStagePresets = FINAL_STAGE_PRESETS;
const selectedGenericPresetName = ref(FINAL_STAGE_PRESETS[0].name);
const finalCfg = reactive<FinalStageVisualizerConfig>({ ...FINAL_STAGE_PRESETS[0] });

function onGenericPresetChange() {
    // Check if it's Final Stage
    if (isFinalStageMode.value) {
        const p = FINAL_STAGE_PRESETS.find(x => x.name === selectedGenericPresetName.value);
        if (p) {
            Object.assign(finalCfg, p);
            // setVisualizerConfig uses partial, but our function expects Butterfly Config type due to TS?
            // Wait, setVisualizerConfig in audioEngine maps to `importSettings`.
            // We need to cast or make setVisualizerConfig generic.
            // For now, I will use:
            _setGenericConfig(p);
        }
    }
}

function onFinalCustomChange() {
    selectedGenericPresetName.value = "Custom";
    _setGenericConfig({ ...finalCfg, name: 'Custom' });
}

function _setGenericConfig(config: any) {
    // We can use the exported helper or direct access
    // The exported setVisualizerConfig is typed to ButterflyVisualizerConfig.
    // Let's rely on JS dynamic nature or fix the type in audioEngine if possible.
    // Actually, let's just use `setVisualizerConfig` and cast to any if needed or update audioEngine later.
    // But since I can't update multiple files easily if I didn't plan it, 
    // I can just cast here.
    setVisualizerConfig(config as any);
}

// Watch for switch to sync Final Stage config
watch(currentVizName, () => {
    if (isFinalStageMode.value) {
         const current = visualizerManager.get(currentVizName.value);
         if (current && 'getSettings' in current) {
             const newCfg = (current as any).getSettings();
             Object.assign(finalCfg, newCfg);
             selectedGenericPresetName.value = newCfg.name || 'Custom';
         }
    }
});

// --- Transfer Function Editing ---
const editingConfigKey = ref<string | null>(null);
const editingConfigTitle = ref<string>("");

// Helper to determine which config object to operate on
const activeConfigObject = computed(() => {
    if (isFinalStageMode.value) return finalCfg;
    return cfg;
});

const currentEditingConfig = computed(() => {
    if (!editingConfigKey.value || !activeConfigObject.value) return undefined;
    // Cast to any for dynamic access
    return (activeConfigObject.value as any)[editingConfigKey.value] as TransferFunctionConfig;
});

function editCurve(key: string, title: string) {
    editingConfigKey.value = key;
    editingConfigTitle.value = title;
}

function closeCurveEditor() {
    editingConfigKey.value = null;
}

function updateCurveConfig(newValue: TransferFunctionConfig) {
    if (editingConfigKey.value && activeConfigObject.value) {
        // Update local state
        (activeConfigObject.value as any)[editingConfigKey.value] = newValue;
        
        // Trigger update to engine
        if (isFinalStageMode.value) {
            onFinalCustomChange();
        } else {
            onCustomChange();
        }
    }
}

</script>

<style scoped>
.control-panel {
  color: white; 
  display: flex;
  flex-direction: column;
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

.tiny-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #00c8ff;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 0.8em;
    cursor: pointer;
    margin-left: auto;
}

.tiny-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

/* Modal Overlay */
.tf-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.tf-modal {
    background: #2a2a35;
    border: 1px solid #444;
    border-radius: 8px;
    width: 350px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    display: flex;
    flex-direction: column;
}

.tf-header {
    background: rgba(0,0,0,0.2);
    padding: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #444;
}

.tf-body {
    padding: 10px;
}

.close-btn {
    background: transparent;
    border: 1px solid #666;
    color: #ccc;
    font-size: 0.8em;
    cursor: pointer;
    padding: 2px 8px;
    border-radius: 4px;
}
</style>
