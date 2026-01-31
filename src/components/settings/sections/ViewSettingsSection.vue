<template>
    <div>
        <div class="section-label group">View</div>
        <div class="row">
            <label class="rotate-label">Rotate:</label>
            <label><input type="radio" :value="0" v-model="config.rotation" @change="$emit('update')"> 0°</label>
            <label><input type="radio" :value="90" v-model="config.rotation" @change="$emit('update')"> 90°</label>
            <label><input type="radio" :value="180" v-model="config.rotation" @change="$emit('update')"> 180°</label>
            <label><input type="radio" :value="270" v-model="config.rotation" @change="$emit('update')"> 270°</label>
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

.rotate-label {
    width: 60px;
}
</style>
