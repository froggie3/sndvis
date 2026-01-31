<template>
    <div class="section-label">Common</div>
    <div class="slider-grid">
         <label>BG H</label><input type="range" min="0" max="360" v-model.number="config.backgroundColor.h" @input="$emit('update')"><span>{{ config.backgroundColor.h }}</span>
         <label>BG S</label><input type="range" min="0" max="100" v-model.number="config.backgroundColor.s" @input="$emit('update')"><span>{{ config.backgroundColor.s }}</span>
         <label>BG L</label><input type="range" min="0" max="100" v-model.number="config.backgroundColor.l" @input="$emit('update')"><span>{{ config.backgroundColor.l }}</span>
    </div>
</template>

<script setup lang="ts">
import type { ColorCapableConfig } from '../../visualizer/config';

defineProps<{
    config: ColorCapableConfig
}>();

defineEmits<{
    (e: 'update'): void
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
</style>
