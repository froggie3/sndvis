<template>
    <div>
        <select v-model="selectedPresetName" @change="onPresetChange" style="margin-bottom: 5px; width: 100%;">
        <option v-for="p in presets" :key="p.name" :value="p.name">{{ p.name }}</option>
        <option value="Custom">Custom</option>
        </select>

        <div class="section-label">Size</div>
        <div class="slider-grid">
        <label>Min</label><input type="range" min="0" max="20" v-model.number="config.minSize" @input="onCustomChange"><span>{{ config.minSize }}</span>
        <label>Max</label><input type="range" min="5" max="100" v-model.number="config.maxSize" @input="onCustomChange"><span>{{ config.maxSize }}</span>
        <label>Scale</label><input type="range" min="1" max="200" v-model.number="config.sizeScale" @input="onCustomChange"><span>{{ config.sizeScale }}</span>
        <div></div><button class="tiny-btn" @click="$emit('edit-curve', 'magToSizeStrategy', 'Magnitude -> Size')" style="grid-column: span 2;">Size Curve</button>
        </div>

        <div class="section-label">Color</div>
        <div class="row">
            <label>Mode:</label>
            <select v-model="config.colorMode" @change="onCustomChange">
                <option value="PhaseHue">Phase Hue</option>
                <option value="FreqGradient_PhaseBrightness">Freq Gradient</option>
            </select>
        </div>

        <!-- Mode: Saturation Shared -->
        <div v-if="config.colorMode === 'PhaseHue' || config.colorMode === 'FreqGradient_PhaseBrightness'" class="slider-grid group">
            <label>Sat</label><input type="range" min="0" max="100" v-model.number="config.hueSaturation" @input="onCustomChange"><span>{{ config.hueSaturation }}</span>
        </div>

        <!-- Mode: Hue -->
        <div v-if="config.colorMode === 'PhaseHue'" class="slider-grid group">
            <label>Offset</label><input type="range" min="0" max="360" v-model.number="config.hueOffset" @input="onCustomChange"><span>{{ config.hueOffset }}°</span>
            <label>Range</label><input type="range" min="-1" max="1" step="0.01" v-model.number="config.hueRangeRatio" @input="onCustomChange"><span>{{ config.hueRangeRatio }}</span>
            <label>LScale</label><input type="range" min="0" max="100" v-model.number="config.hueLightnessScale" @input="onCustomChange"><span>{{ config.hueLightnessScale }}</span>
            <div class="range-display" style="grid-column: 1 / span 3; color: #aaa; font-size: 0.8em; margin-top: 4px;">
            Map: {{ hueRangeText }}
            </div>
            <div></div><button class="tiny-btn" @click="$emit('edit-curve', 'phaseToHueStrategy', 'Phase -> Hue')" style="grid-column: span 2;">Hue Curve</button>
            <div></div><button class="tiny-btn" @click="$emit('edit-curve', 'adsrToLightnessStrategy', 'ADSR -> Lightness')" style="grid-column: span 2;">Lightness Curve</button>
        </div>

        <!-- Mode: Freq -->
        <div v-if="config.colorMode === 'FreqGradient_PhaseBrightness'" class="slider-grid group">
            <label>StartHue</label><input type="range" min="0" max="360" v-model.number="config.freqHueStart" @input="onCustomChange"><span>{{ config.freqHueStart }}</span>
            <label>EndHue</label><input type="range" min="0" max="360" v-model.number="config.freqHueEnd" @input="onCustomChange"><span>{{ config.freqHueEnd }}</span>
            <div></div><button class="tiny-btn" @click="$emit('edit-curve', 'freqToHueStrategy', 'Freq -> Hue Gradient')" style="grid-column: span 2;">Gradient Curve</button>
        </div>

        <div v-if="isMultiMode" class="section-label group">Butterfly Line Color</div>
        <div v-if="isMultiMode" class="slider-grid">
             <label>H</label><input type="range" min="0" max="360" v-model.number="config.butterflyLineColor.h" @input="onCustomChange"><span>{{ config.butterflyLineColor.h }}</span>
             <label>S</label><input type="range" min="0" max="100" v-model.number="config.butterflyLineColor.s" @input="onCustomChange"><span>{{ config.butterflyLineColor.s }}</span>
             <label>L</label><input type="range" min="0" max="100" v-model.number="config.butterflyLineColor.l" @input="onCustomChange"><span>{{ config.butterflyLineColor.l }}</span>
        </div>

        <div class="section-label">Signal Normalization</div>
        <div class="row" style="flex-wrap: wrap;">
            <label>Mode:</label>
            <select v-model="config.normalizationMode" @change="onCustomChange">
                <option value="NONE">None (Raw)</option>
                <option value="LOG">Logarithmic</option>
            </select>
            
            <div v-if="config.normalizationMode === 'LOG'" style="display:inline-flex; align-items:center; gap:5px; margin-left: 10px;">
            <label>Base:</label>
            <input type="number" v-model.number="config.logBase" min="2" max="100" style="width: 50px;" @input="onCustomChange">
            </div>
            <button class="tiny-btn" @click="$emit('edit-curve', 'magNormStrategy', 'Magnitude Normalization')">Curve</button>
        </div>

        <div class="section-label">Fractal Scaling</div>
        <div class="row">
            <label><input type="checkbox" v-model="config.useFractalSize" @change="onCustomChange"> Enabled</label>
        </div>
        <div v-if="config.useFractalSize" class="slider-grid group">
            <label>Decay</label>
            <input type="range" min="0.5" max="1.2" step="0.01" v-model.number="config.fractalDecay" @input="onCustomChange">
            <span>{{ config.fractalDecay }}</span>
        </div>

        <div class="section-label group">View</div>
        <div class="row">
            <label style="width: 60px;">Rotate:</label>
            <label><input type="radio" :value="0" v-model="config.rotation" @change="onCustomChange"> 0°</label>
            <label><input type="radio" :value="90" v-model="config.rotation" @change="onCustomChange"> 90°</label>
            <label><input type="radio" :value="180" v-model="config.rotation" @change="onCustomChange"> 180°</label>
            <label><input type="radio" :value="270" v-model="config.rotation" @change="onCustomChange"> 270°</label>
        </div>
        
        <!-- Stage Separation - Logic based on Single/Multi -->
        <div class="section-label" v-if="showStageControls">Stage Separation</div>
        <div class="stage-grid" v-if="showStageControls">
            <label class="stage-item" v-if="isMultiMode">
                <input type="radio" :value="-1" v-model="config.selectedStageIndex" @change="onCustomChange"> All
            </label>
            
            <template v-if="isSingleMode">
                <label v-for="s in availableStages" :key="s" class="stage-item">
                    <input type="radio" :value="s" v-model="config.selectedStageIndex" @change="onCustomChange"> S{{ s }}
                </label>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { VIZ_PRESETS, type ButterflyVisualizerConfig } from '../../visualizer/config';

const props = defineProps<{
    config: ButterflyVisualizerConfig;
    isMultiMode: boolean;
    isSingleMode: boolean;
    availableStages: number[];
}>();

const emit = defineEmits<{
    (e: 'update'): void;
    (e: 'edit-curve', key: string, title: string): void;
}>();

const showStageControls = computed(() => props.isMultiMode || props.isSingleMode);
const presets = VIZ_PRESETS;
const selectedPresetName = ref(VIZ_PRESETS[0].name);

watch(() => props.config.name, (newName) => {
    selectedPresetName.value = newName || 'Custom';
}, { immediate: true });


function onPresetChange() {
    const p = VIZ_PRESETS.find(x => x.name === selectedPresetName.value);
    if (p) {
        Object.assign(props.config, p);
        emit('update');
    }
}

function onCustomChange() {
    selectedPresetName.value = "Custom";
    props.config.name = 'Custom';
    emit('update');
}

const hueRangeText = computed(() => {
    const start = ((props.config.hueOffset % 360) + 360) % 360;
    const range = props.config.hueRangeRatio * 360;
    const endRaw = props.config.hueOffset + range;
    const end = ((endRaw % 360) + 360) % 360;

    // Distinguish between 0 range and 360 range when start equals end
    if (start === end && Math.abs(props.config.hueRangeRatio) >= 1) {
        const sign = props.config.hueRangeRatio > 0 ? "" : "-";
        return `${start.toFixed(0)}° ～ ${sign}360°`;
    }
    
    // For ratio 0, just show a single value
    if (props.config.hueRangeRatio === 0) {
        return `${start.toFixed(0)}°`;
    }

    return `${start.toFixed(0)}° ～ ${end.toFixed(0)}°`;
});

</script>

<style scoped>
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
</style>
