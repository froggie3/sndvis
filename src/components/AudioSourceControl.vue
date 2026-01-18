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
      
      <div class="playback-controls">
          <div class="time-display" @click="toggleTimeMode">
              {{ timeDisplay }}
          </div>
          <input 
              type="range" 
              class="seek-bar"
              min="0" 
              :max="pbState.duration" 
              :value="pbState.currentTime" 
              step="0.01"
              @input="onSeek"
          >
          <div class="buttons-row">
              <button @click="skip(-5)">⏪ 5s</button>
              <button @click="togglePlay">{{ pbState.isPlaying ? '⏸' : '▶' }}</button>
              <button @click="stop">⏹</button>
              <button @click="skip(5)">5s ⏩</button>
          </div>
      </div>
      
      <button class="export-btn" @click="startExport" :disabled="appState.isExporting">
        {{ appState.isExporting ? `Exporting ${Math.round(appState.exportProgress * 100)}%` : 'Render Video (.webm)' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { appState, switchSource, loadAudioFile, startExport, playbackState, togglePlayback, stop, seek, skip as engineSkip } from '../logic/audioEngine';

const pbState = playbackState;
const showSamples = ref(false);

const timeDisplay = computed(() => {
    if (showSamples.value) {
        return `${pbState.currentSamples} / ${pbState.totalSamples}`;
    } else {
        const fmt = (t: number) => {
            const m = Math.floor(t / 60);
            const s = Math.floor(t % 60);
            const ms = Math.floor((t % 1) * 1000);
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
        };
        return `${fmt(pbState.currentTime)} / ${fmt(pbState.duration)}`;
    }
});

function toggleTimeMode() {
    showSamples.value = !showSamples.value;
}

function onSeek(e: Event) {
    const v = parseFloat((e.target as HTMLInputElement).value);
    seek(v);
}

function skip(delta: number) {
    engineSkip(delta);
}

function togglePlay() {
    togglePlayback();
}

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

.playback-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 10px;
    margin-bottom: 5px;
    background: rgba(0,0,0,0.3);
    padding: 10px;
    border-radius: 6px;
}

.time-display {
    font-family: monospace;
    text-align: center;
    font-size: 1.1em;
    background: rgba(0,0,0,0.3);
    padding: 4px;
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
}

.seek-bar {
    width: 100%;
    cursor: pointer;
}

.buttons-row {
    display: flex;
    justify-content: space-between;
    gap: 5px;
}

.buttons-row button {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9em;
}

.buttons-row button:hover {
    background: rgba(255,255,255,0.2);
}
</style>
