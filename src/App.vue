<template>
  <div id="app-root">
    <!-- Canvas Layer -->
    <VisualizerCanvas />

    <!-- UI Layer -->
    <div class="ui-layer">
      <!-- Bottom Left Controls -->
      <div class="bottom-left">
        <VisualizerSettingsControl class="control-block" />
        <EnvelopeControl class="control-block" />
        <SpectralControl class="control-block" />
        <AudioSourceControl class="control-block" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import VisualizerCanvas from './components/VisualizerCanvas.vue';
import AudioSourceControl from './components/AudioSourceControl.vue';
import SpectralControl from './components/SpectralControl.vue';
import EnvelopeControl from './components/EnvelopeControl.vue';
import VisualizerSettingsControl from './components/VisualizerSettingsControl.vue';
</script>

<style>
/* Global Resets */
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background-color: black;
  color: white;
}

#app-root {
  position: relative;
  width: 100vw;
  height: 100vh;
}

.ui-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Let clicks pass through to canvas if needed, but controls are pointer-events: auto */
}

.bottom-left {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  pointer-events: auto;
  max-height: 90vh;
  overflow-y: auto;
}

.control-block {
    background-color: rgba(0, 0, 0, 0.6);
    padding: 15px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    backdrop-filter: blur(5px);
}

/* Scrollbar styling for controls if window small */
.bottom-left::-webkit-scrollbar {
  width: 6px;
}
.bottom-left::-webkit-scrollbar-thumb {
  background-color: rgba(255,255,255,0.3);
  border-radius: 3px;
}

</style>
