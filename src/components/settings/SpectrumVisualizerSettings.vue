<template>
    <div class="group" style="padding-top: 5px;">
        <select v-model="selectedGenericPresetName" @change="onGenericPresetChange" style="margin-bottom: 5px; width: 100%;">
            <option v-for="p in finalStagePresets" :key="p.name" :value="p.name">{{ p.name }}</option>
            <option value="Custom">Custom</option>
        </select>

        <div class="section-label">Display Mode</div>
        <div class="row">
             <label><input type="radio" value="REAL" v-model="config.showMode" @change="onCustomChange"> Real</label>
             <label><input type="radio" value="IMAG" v-model="config.showMode" @change="onCustomChange"> Imag</label>
             <label><input type="radio" value="BOTH" v-model="config.showMode" @change="onCustomChange"> Both</label>
        </div>

        <div class="section-label">Scaling Mode</div>
        <div class="row">
            <select v-model="config.scaleMode" @change="onCustomChange">
                <option value="LINEAR">Linear</option>
                <option value="LOG">Logarithmic</option>
                <option value="MEL">Mel Scale</option>
                <option value="CUSTOM">Custom (Exp)</option>
            </select>
            <button class="tiny-btn" @click="$emit('edit-curve', 'freqToXStrategy', 'Frequency Layout')">Curve</button>
        </div>
        <div v-if="config.scaleMode === 'CUSTOM'" class="row">
             <label>Exp:</label>
             <input type="number" step="0.1" v-model.number="config.customExponent" @change="onCustomChange" style="width: 50px;">
        </div>

        <div class="section-label">Appearance</div>
        <div class="slider-grid">
             <label>Min</label><input type="range" min="0" max="20" v-model.number="config.minSize" @input="onCustomChange"><span>{{ config.minSize }}</span>
             <label>Max</label><input type="range" min="5" max="100" v-model.number="config.maxSize" @input="onCustomChange"><span>{{ config.maxSize }}</span>
             <label>Scale</label><input type="range" min="0.1" max="5.0" step="0.1" v-model.number="config.sizeScale" @input="onCustomChange"><span>{{ config.sizeScale }}</span>
             <div></div><button class="tiny-btn" @click="$emit('edit-curve', 'magToSizeStrategy', 'Magnitude -> Size')" style="grid-column: span 2;">Size Curve</button>
        </div>
        
        <div class="row" style="margin-top: 5px;">
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
            <label>Lightness</label><input type="range" min="0" max="100" v-model.number="config.hueLightnessScale" @input="onCustomChange"><span>{{ config.hueLightnessScale }}</span>
            <div></div><button class="tiny-btn" @click="$emit('edit-curve', 'phaseToHueStrategy', 'Phase -> Hue')" style="grid-column: span 2;">Hue Curve</button>
            <div></div><button class="tiny-btn" @click="$emit('edit-curve', 'adsrToLightnessStrategy', 'ADSR -> Lightness')" style="grid-column: span 2;">Lightness Curve</button>
        </div>

        <!-- Mode: Freq -->
        <div v-if="config.colorMode === 'FreqGradient_PhaseBrightness'" class="slider-grid group">
            <label>StartHue</label><input type="range" min="0" max="360" v-model.number="config.freqHueStart" @input="onCustomChange"><span>{{ config.freqHueStart }}</span>
            <label>EndHue</label><input type="range" min="0" max="360" v-model.number="config.freqHueEnd" @input="onCustomChange"><span>{{ config.freqHueEnd }}</span>
            <div></div><button class="tiny-btn" @click="$emit('edit-curve', 'freqToHueStrategy', 'Freq -> Hue Gradient')" style="grid-column: span 2;">Gradient Curve</button>
        </div>

        <div class="section-label group">Grid Color</div>
        <div class="slider-grid">
             <label>H</label><input type="range" min="0" max="360" v-model.number="config.gridColor.h" @input="onCustomChange"><span>{{ config.gridColor.h }}</span>
             <label>S</label><input type="range" min="0" max="100" v-model.number="config.gridColor.s" @input="onCustomChange"><span>{{ config.gridColor.s }}</span>
             <label>L</label><input type="range" min="0" max="100" v-model.number="config.gridColor.l" @input="onCustomChange"><span>{{ config.gridColor.l }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { FINAL_STAGE_PRESETS, type FinalStageVisualizerConfig } from '../../visualizer/config';

const props = defineProps<{
    config: FinalStageVisualizerConfig
}>();

const emit = defineEmits<{
    (e: 'update'): void;
    (e: 'edit-curve', key: string, title: string): void;
    (e: 'preset-loaded', config: any): void; // Tell parent so it can set the name to custom if needed? Actually existing logic is self-contained mostly for values.
    // Parent handles actual setVisualizerConfig.
    // Wait, the parent needs to persist it.
}>();

const finalStagePresets = FINAL_STAGE_PRESETS;
const selectedGenericPresetName = ref(FINAL_STAGE_PRESETS[0].name);

// Logic to sync preset name with custom changes from parent if needed?
// The parent passes `config` which is reactive.
// We should check if the config name matches a preset.
watch(() => props.config.name, (newName) => {
    selectedGenericPresetName.value = newName || 'Custom';
}, { immediate: true });

function onGenericPresetChange() {
    const p = FINAL_STAGE_PRESETS.find(x => x.name === selectedGenericPresetName.value);
    if (p) {
        // We emit update implicitly by mutating the prop object?
        // Vue props are not strictly read-only if it's an object, but mutating props is generally discouraged unless it's designed as a model.
        // But the parent is using reactive() and passing it.
        Object.assign(props.config, p);
        emit('update');
    }
}

function onCustomChange() {
    selectedGenericPresetName.value = "Custom";
    props.config.name = 'Custom';
    emit('update');
}

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
