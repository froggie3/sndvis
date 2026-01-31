<template>
    <div>
        <div class="section-label">Signal Normalization</div>
        <div class="row">
            <label>Mode:</label>
            <select v-model="config.normalizationMode" @change="$emit('update')">
                <option value="NONE">None (Raw)</option>
                <option value="LOG">Logarithmic</option>
            </select>

            <div v-if="config.normalizationMode === 'LOG'" class="log-base-input">
                <label>Base:</label>
                <input type="number" v-model.number="config.logBase" min="2" max="100" @input="$emit('update')">
            </div>
            <button class="tiny-btn"
                @click="$emit('edit-curve', 'magNormStrategy', 'Magnitude Normalization')">Curve</button>
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

.row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 5px;
    flex-wrap: wrap;
}

.log-base-input {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-left: 10px;
}

.log-base-input input {
    width: 50px;
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
