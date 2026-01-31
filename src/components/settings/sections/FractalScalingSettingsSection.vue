<template>
    <div>
        <div class="section-label">Fractal Scaling</div>
        <div class="row">
            <label>
                <input type="checkbox" v-model="config.useFractalSize" @change="$emit('update')"> Enabled
            </label>
        </div>
        <div v-if="config.useFractalSize" class="slider-grid group">
            <label>Decay</label>
            <input type="range" min="0.5" max="1.2" step="0.01" v-model.number="config.fractalDecay"
                @input="$emit('update')">
            <span>{{ config.fractalDecay }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ButterflyVisualizerConfig } from '../../../visualizer/config';

defineProps<{
    config: ButterflyVisualizerConfig;
}>();

defineEmits<{
    (e: 'update'): void;
}>();
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
</style>
