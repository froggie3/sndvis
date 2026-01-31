<template>
    <div>
        <select v-model="selectedPresetName" @change="onPresetChange" class="preset-select">
            <option v-for="p in presets" :key="p.name" :value="p.name">{{ p.name }}</option>
            <option value="Custom">Custom</option>
        </select>

        <SizeSettingsSection 
            :config="config" 
            @update="onCustomChange"
            @edit-curve="(key, title) => $emit('edit-curve', key, title)"
        />

        <ColorSettingsSection 
            :config="config" 
            :is-multi-mode="isMultiMode"
            @update="onCustomChange"
            @edit-curve="(key, title) => $emit('edit-curve', key, title)"
        />

        <NormalizationSettingsSection 
            :config="config" 
            @update="onCustomChange"
            @edit-curve="(key, title) => $emit('edit-curve', key, title)"
        />

        <FractalScalingSettingsSection 
            :config="config" 
            @update="onCustomChange"
        />

        <ViewSettingsSection 
            :config="config" 
            @update="onCustomChange"
        />
        
        <StageSeparationSection 
            :config="config" 
            :is-multi-mode="isMultiMode"
            :is-single-mode="isSingleMode"
            :available-stages="availableStages"
            @update="onCustomChange"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { VIZ_PRESETS, type ButterflyVisualizerConfig } from '../../visualizer/config';
import SizeSettingsSection from './sections/SizeSettingsSection.vue';
import ColorSettingsSection from './sections/ColorSettingsSection.vue';
import NormalizationSettingsSection from './sections/NormalizationSettingsSection.vue';
import FractalScalingSettingsSection from './sections/FractalScalingSettingsSection.vue';
import ViewSettingsSection from './sections/ViewSettingsSection.vue';
import StageSeparationSection from './sections/StageSeparationSection.vue';

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

</script>

<style scoped>
.preset-select {
    margin-bottom: 5px;
    width: 100%;
}
</style>
