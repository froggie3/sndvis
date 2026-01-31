<template>
  <div class="control-panel">
    <strong>Visualizer Settings</strong>
    
    <!-- Common Settings -->
    <CommonVisualizerSettings 
        :config="colorCfg" 
        @update="onColorChange" 
    />

    <!-- Spectrum (Final Stage) Settings -->
    <SpectrumVisualizerSettings 
        v-if="isFinalStageMode"
        :config="finalCfg"
        @update="onFinalCustomChange"
        @edit-curve="editCurve"
    />

    <!-- Butterfly Settings -->
    <ButterflyVisualizerSettings
        v-else-if="currentVizName.includes('Butterfly')"
        :config="cfg"
        :isMultiMode="isMultiMode"
        :isSingleMode="isSingleMode"
        :availableStages="availableStages"
        @update="onCustomChange"
        @edit-curve="editCurve"
    />

    <!-- Modal for Curve Editing -->
    <CurveEditorModal
        v-if="editingConfigKey"
        :title="editingConfigTitle"
        :activeConfig="currentEditingConfig"
        @close="closeCurveEditor"
        @update="updateCurveConfig"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { VIZ_PRESETS, type ButterflyVisualizerConfig, FINAL_STAGE_PRESETS, type FinalStageVisualizerConfig, type ColorCapableConfig } from '../visualizer/config';
import { setVisualizerConfig, appState, visualizerManager } from '../logic/audioEngine';
import type { TransferFunctionConfig } from '../domain/transfer-function';

// Child Components
import CommonVisualizerSettings from './settings/CommonVisualizerSettings.vue';
import SpectrumVisualizerSettings from './settings/SpectrumVisualizerSettings.vue';
import ButterflyVisualizerSettings from './settings/ButterflyVisualizerSettings.vue';
import CurveEditorModal from './settings/CurveEditorModal.vue';

const currentVizName = computed(() => visualizerManager.state.currentName);
const isMultiMode = computed(() => currentVizName.value.includes('(Multi)'));
const isSingleMode = computed(() => currentVizName.value.includes('(Single)'));
const isFinalStageMode = computed(() => currentVizName.value.includes('Spectrum'));

const colorCfg = computed<ColorCapableConfig>(() => {
    if (isFinalStageMode.value) return finalCfg;
    return cfg;
});

function onColorChange() {
    if (isFinalStageMode.value) onFinalCustomChange();
    else onCustomChange();
}

const cfg = reactive<ButterflyVisualizerConfig>({ ...VIZ_PRESETS[0] });

function onCustomChange() {
    setVisualizerConfig({ ...cfg, name: 'Custom' });
}

// Ensure init state helps engine (though engine defaults might match)
setVisualizerConfig(cfg);

// Dynamic Stages
const availableStages = computed(() => {
    // FFT Size -> Stages
    // log2(128) = 7. Total stages = 7 + 1 = 8. (0..7)
    const log2 = Math.log2(appState.fftSize);
    const count = Math.floor(log2) + 1; // Corrected count
    return Array.from({ length: count }, (_, i) => i);
});

// Watch for FFT size changes to reset selection if out of bounds
watch(() => appState.fftSize, (newSize) => {
    const maxIndex = Math.floor(Math.log2(newSize)); 
    if (cfg.selectedStageIndex > maxIndex) {
        // If out of bounds, clamp to maxIndex.
        // For Multi, -1 is fine.
        if (cfg.selectedStageIndex !== -1) {
            cfg.selectedStageIndex = maxIndex;
            setVisualizerConfig(cfg);
        }
    }
});

// Watch for visualizer switch to re-sync config?
// The config object 'cfg' here is local. If the audio engine has separate instances,
// switching visualizer means 'setVisualizerConfig' will apply to the NEW one, but we are using 'cfg' values.
// Ideally, when we switch, we should load settings FROM the new visualizer.
// Since 'ButterflyVisualizer' has getSettings(), we can pull it.
// But we need to know WHEN it switches.
watch(currentVizName, () => {
    // Reload config from active visualizer if possible
    const current = visualizerManager.get(currentVizName.value);
    // TypeScript check for ButterflyVisualizer...
    // We can assume if name includes Butterfly, it matches.
    if (current && 'getSettings' in current) {
         const newCfg = (current as any).getSettings();
         Object.assign(cfg, newCfg);
         // Name sync is handled inside child via prop watch if needed, but we pass the object ref so it's fine.
    }
    
    // Enforce constraints
    if (isMultiMode.value && cfg.selectedStageIndex !== -1) {
        cfg.selectedStageIndex = -1;
        setVisualizerConfig(cfg);
    } else if (isSingleMode.value && cfg.selectedStageIndex === -1) {
        cfg.selectedStageIndex = 0;
        setVisualizerConfig(cfg);
    }
});

// Final Stage Logic
const finalCfg = reactive<FinalStageVisualizerConfig>({ ...FINAL_STAGE_PRESETS[0] });

function onFinalCustomChange() {
    // We can use the exported helper or direct access
    // The exported setVisualizerConfig is typed to ButterflyVisualizerConfig.
    // Let's rely on JS dynamic nature or fix the type in audioEngine if possible.
    // Actually, let's just use `setVisualizerConfig` and cast to any if needed or update audioEngine later.
    // But since I can't update multiple files easily if I didn't plan it, 
    // I can just cast here.
    setVisualizerConfig(finalCfg as any);
}

// Watch for switch to sync Final Stage config
watch(currentVizName, () => {
    if (isFinalStageMode.value) {
         const current = visualizerManager.get(currentVizName.value);
         if (current && 'getSettings' in current) {
             const newCfg = (current as any).getSettings();
             Object.assign(finalCfg, newCfg);
         }
    }
});

// --- Transfer Function Editing ---
const editingConfigKey = ref<string | null>(null);
const editingConfigTitle = ref<string>("");

// Helper to determine which config object to operate on
const activeConfigObject = computed(() => {
    if (isFinalStageMode.value) return finalCfg;
    return cfg;
});

const currentEditingConfig = computed(() => {
    if (!editingConfigKey.value || !activeConfigObject.value) return undefined;
    // Cast to any for dynamic access
    return (activeConfigObject.value as any)[editingConfigKey.value] as TransferFunctionConfig;
});

function editCurve(key: string, title: string) {
    editingConfigKey.value = key;
    editingConfigTitle.value = title;
}

function closeCurveEditor() {
    editingConfigKey.value = null;
}

function updateCurveConfig(newValue: TransferFunctionConfig) {
    if (editingConfigKey.value && activeConfigObject.value) {
        // Update local state
        (activeConfigObject.value as any)[editingConfigKey.value] = newValue;
        
        // Trigger update to engine
        if (isFinalStageMode.value) {
            onFinalCustomChange();
        } else {
            onCustomChange();
        }
    }
}

</script>

<style scoped>
.control-panel {
  color: white; 
  display: flex;
  flex-direction: column;
}
</style>
