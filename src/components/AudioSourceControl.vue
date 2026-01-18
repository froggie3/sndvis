<template>
  <div class="control-panel source-control">
    <div class="row">
      <label>Source: </label>
      <select :value="appState.currentSourceType" @change="onChangeSource">
        <option value="test">Test Signal (Sine)</option>
        <option value="mic">Microphone</option>
        <option value="file">File Player</option>
      </select>
    </div>

    <div v-if="appState.currentSourceType === 'file'" class="file-input-area">
      <label>Select Audio File: </label>
      <input type="file" accept="audio/*" @change="onFileChange" />
      
      <button class="export-btn" @click="startExport" :disabled="appState.isExporting">
        {{ appState.isExporting ? `Exporting ${Math.round(appState.exportProgress * 100)}%` : 'Render Video (.webm)' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { appState, switchSource, loadAudioFile, startExport } from '../logic/audioEngine';

function onChangeSource(e: Event) {
  const val = (e.target as HTMLSelectElement).value;
  switchSource(val);
}

function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (files && files.length > 0) {
    loadAudioFile(files[0]);
  }
}
</script>

<style scoped>
.control-panel {
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 10px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-input-area {
  display: flex;
  flex-direction: column;
  gap: 5px;
  animation: fadeIn 0.3s ease;
}

.export-btn {
  margin-top: 5px;
  padding: 8px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.export-btn:disabled {
  background-color: #666;
  cursor: not-allowed;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
