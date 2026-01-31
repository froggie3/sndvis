<template>
    <div v-if="showStageControls">
        <div class="section-label">Stage Separation</div>
        <div class="stage-grid">
            <label class="stage-item" v-if="isMultiMode">
                <input type="radio" :value="-1" v-model="config.selectedStageIndex" @change="$emit('update')"> All
            </label>

            <template v-if="isSingleMode">
                <label v-for="s in availableStages" :key="s" class="stage-item">
                    <input type="radio" :value="s" v-model="config.selectedStageIndex" @change="$emit('update')"> S{{ s
                    }}
                </label>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ButterflyVisualizerConfig } from '../../../visualizer/config';

const props = defineProps<{
    config: ButterflyVisualizerConfig;
    isMultiMode: boolean;
    isSingleMode: boolean;
    availableStages: number[];
}>();

defineEmits<{
    (e: 'update'): void;
}>();

const showStageControls = computed(() => props.isMultiMode || props.isSingleMode);
</script>

<style scoped>
.section-label {
    font-size: 0.85em;
    margin: 5px 0;
    color: #ccc;
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
</style>
