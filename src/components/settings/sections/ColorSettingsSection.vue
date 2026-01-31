<template>
    <div>
        <div class="section-label">Color</div>
        <div class="row">
            <label>Mode:</label>
            <select v-model="config.colorMode" @change="$emit('update')">
                <option value="PhaseHue">Phase Hue</option>
                <option value="FreqGradient_PhaseBrightness">Freq Gradient</option>
            </select>
        </div>

        <!-- Mode: Saturation Shared -->
        <div v-if="config.colorMode === 'PhaseHue' || config.colorMode === 'FreqGradient_PhaseBrightness'"
            class="slider-grid group">
            <label>Sat</label>
            <input type="range" min="0" max="100" v-model.number="config.hueSaturation" @input="$emit('update')">
            <span>{{ config.hueSaturation }}</span>
        </div>

        <!-- Mode: Hue -->
        <div v-if="config.colorMode === 'PhaseHue'" class="slider-grid group">
            <label>Offset</label>
            <input type="range" min="0" max="360" v-model.number="config.hueOffset" @input="$emit('update')">
            <span>{{ config.hueOffset }}°</span>

            <label>Range</label>
            <input type="range" min="-1" max="1" step="0.01" v-model.number="config.hueRangeRatio"
                @input="$emit('update')">
            <span>{{ config.hueRangeRatio }}</span>

            <label>LScale</label>
            <input type="range" min="0" max="100" v-model.number="config.hueLightnessScale" @input="$emit('update')">
            <span>{{ config.hueLightnessScale }}</span>

            <div class="range-display">
                Map: {{ hueRangeText }}
            </div>

            <div></div>
            <button class="tiny-btn curve-btn" @click="$emit('edit-curve', 'phaseToHueStrategy', 'Phase -> Hue')">
                Hue Curve
            </button>

            <div></div>
            <button class="tiny-btn curve-btn"
                @click="$emit('edit-curve', 'adsrToLightnessStrategy', 'ADSR -> Lightness')">
                Lightness Curve
            </button>
        </div>

        <!-- Mode: Freq -->
        <div v-if="config.colorMode === 'FreqGradient_PhaseBrightness'" class="slider-grid group">
            <label>StartHue</label>
            <input type="range" min="0" max="360" v-model.number="config.freqHueStart" @input="$emit('update')">
            <span>{{ config.freqHueStart }}</span>

            <label>EndHue</label>
            <input type="range" min="0" max="360" v-model.number="config.freqHueEnd" @input="$emit('update')">
            <span>{{ config.freqHueEnd }}</span>

            <div></div>
            <button class="tiny-btn curve-btn"
                @click="$emit('edit-curve', 'freqToHueStrategy', 'Freq -> Hue Gradient')">
                Gradient Curve
            </button>
        </div>

        <div v-if="isMultiMode" class="section-label group">Butterfly Line Color</div>
        <div v-if="isMultiMode" class="slider-grid">
            <label>H</label>
            <input type="range" min="0" max="360" v-model.number="config.butterflyLineColor.h" @input="$emit('update')">
            <span>{{ config.butterflyLineColor.h }}</span>

            <label>S</label>
            <input type="range" min="0" max="100" v-model.number="config.butterflyLineColor.s" @input="$emit('update')">
            <span>{{ config.butterflyLineColor.s }}</span>

            <label>L</label>
            <input type="range" min="0" max="100" v-model.number="config.butterflyLineColor.l" @input="$emit('update')">
            <span>{{ config.butterflyLineColor.l }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ButterflyVisualizerConfig } from '../../../visualizer/config';

const props = defineProps<{
    config: ButterflyVisualizerConfig;
    isMultiMode: boolean;
}>();

defineEmits<{
    (e: 'update'): void;
    (e: 'edit-curve', key: string, title: string): void;
}>();

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
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.range-display {
    grid-column: 1 / span 3;
    color: #aaa;
    font-size: 0.8em;
    margin-top: 4px;
}

.curve-btn {
    grid-column: span 2;
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
