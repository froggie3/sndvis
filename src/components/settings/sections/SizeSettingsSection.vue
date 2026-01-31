<template>
    <div>
        <div class="section-label">Size</div>
        <div class="slider-grid">
            <label>Min</label>
            <input type="range" min="0" max="20" v-model.number="config.minSize" @input="$emit('update')">
            <span>{{ config.minSize }}</span>

            <label>Max</label>
            <input type="range" min="5" max="100" v-model.number="config.maxSize" @input="$emit('update')">
            <span>{{ config.maxSize }}</span>

            <label>Scale</label>
            <input type="range" min="1" max="200" v-model.number="config.sizeScale" @input="$emit('update')">
            <span>{{ config.sizeScale }}</span>

            <div></div>
            <button class="tiny-btn curve-btn" @click="$emit('edit-curve', 'magToSizeStrategy', 'Magnitude -> Size')">
                Size Curve
            </button>
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
    (e: 'edit-curve', key: string, title: string): void;
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
