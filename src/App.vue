<template>
  <div id="app-root" @click="onCanvasClick">
    <!-- Canvas Layer -->
    <VisualizerCanvas />

    <!-- UI Layer -->
    <div class="ui-layer">
      <!-- Bottom Left Controls -->
      <div class="bottom-left">
        <transition name="slide-up">
          <div v-show="showSettings" class="settings-container">
            <VisualizerSettingsControl class="control-block" />
            <EnvelopeControl class="control-block" />
            <SpectralControl class="control-block" />
            <AudioSourceControl class="control-block" />
          </div>
        </transition>
        
        <transition name="fade">
          <button v-show="settingsIconVisible" class="master-toggle" @click="toggleSettings" title="Toggle Settings">
            🔧
          </button>
        </transition>
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
import { ref, onMounted, onUnmounted, watch } from 'vue';

const showSettings = ref(true);
const settingsIconVisible = ref(true);
let hideTimer: number | undefined;

function resetHideTimer() {
  settingsIconVisible.value = true;
  if (hideTimer) clearTimeout(hideTimer);
  
  // If settings are open, do not auto-hide
  if (showSettings.value) return;

  hideTimer = window.setTimeout(() => {
    settingsIconVisible.value = false;
  }, 5000);
}

function onCanvasClick(e: MouseEvent) {
  // Ignore clicks on UI controls
  if ((e.target as Element).closest('.bottom-left')) return;

  // If settings panel is open, clicking canvas usually implies closing it or doing nothing.
  // Requirement focus is "Toggle Settings Icon".
  // If panel is open, we can't hide icon.
  // Use behavior: If panel is open, Close Panel (and hide icon?). 
  // Or just ignore? 
  // Let's assume "Clicking screen" means "I want to see/hide the icon" (when panel is closed).
  
  if (showSettings.value) {
      // Optional: Close settings if clicking outside? 
      // User didn't ask for this specifically, but "Toggle Icon" implies managing visibility.
      // If I hide the icon, I should probably close the settings too?
      // Let's toggle the *Panel* off if it's open?
      // The prompt says "Toggle Settings *Icon*".
      // Let's stick to: If panel closed, toggle icon.
      // If panel open, do nothing? Or maybe close panel?
      // "Clicking screen immediately toggles [Icon] visibility".
      // If Panel Open, Icon Visible. correct?
      // If I click, I want Icon Hidden. But Icon Hidden implies Panel Closed.
      // So: Close Panel AND Hide Icon.
      
      showSettings.value = false;
      settingsIconVisible.value = false;
      if (hideTimer) clearTimeout(hideTimer);
  } else {
      // Panel is closed.
      if (settingsIconVisible.value) {
          // Visible -> Hide immediately
          settingsIconVisible.value = false;
          if (hideTimer) clearTimeout(hideTimer);
      } else {
          // Hidden -> Show (and start timer)
          settingsIconVisible.value = true;
          // Restart timer for auto-hide
          resetHideTimer();
      }
  }
}

function toggleSettings() {
  showSettings.value = !showSettings.value;
}

watch(showSettings, () => {
    resetHideTimer();
});

onMounted(() => {
  resetHideTimer();
});

onUnmounted(() => {
  if (hideTimer) clearTimeout(hideTimer);
});
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
  overflow: visible; /* Allow buttons popup if needed */
}

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 80vh;
  overflow-y: auto;
  padding-right: 5px; /* space for scrollbar */
  width: 23rem; /* Enforce fixed width for all controls */
}

.master-toggle {
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    font-size: 1.5em;
    cursor: pointer;
    padding: 8px 12px;
    backdrop-filter: blur(4px);
    align-self: flex-start;
    transition: background 0.2s;
}
.master-toggle:hover {
    background: rgba(255,255,255,0.2);
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
  max-height: 80vh;
  opacity: 1;
}

.slide-up-enter-from,
.slide-up-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(20px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.settings-container::-webkit-scrollbar {
  width: 6px;
}
.settings-container::-webkit-scrollbar-thumb {
  background-color: rgba(255,255,255,0.3);
  border-radius: 3px;
}

.control-block {
    background-color: rgba(0, 0, 0, 0.6);
    padding: 15px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    backdrop-filter: blur(5px);
}


/* Clean up scrollbar on .bottom-left itself since we moved scrolling to inner container */
.bottom-left::-webkit-scrollbar {
  display: none;
}

</style>
