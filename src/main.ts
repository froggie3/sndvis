import './style.css'
import p5 from 'p5';
import { FFTProcessor } from './domain/fft-processor.js';
import { ButterflyVisualizer } from './visualizer/ButterflyVisualizer.js';
import { TestSignalSource } from './io/TestSignalSource.js';
import { MicrophoneSource } from './io/MicrophoneSource.js';
import { FileAudioSource } from './io/FileAudioSource.js';
import { RealtimeLoop } from './io/RealtimeLoop.js';
import { OfflineExportLoop } from './io/OfflineExportLoop.js';
import { SpectralWhitener } from './domain/spectral-whitener.js';
import { PRESETS, type EnvelopeConfig } from './domain/envelope-config.js';
import { AppCoordinator } from './AppCoordinator.js';
import type { IAudioSource } from './io/IAudioSource.js';
import type { IRenderLoop } from './io/IRenderLoop.js';

// Setup
const N = 128;
const processor = new FFTProcessor(N);
const whitener = new SpectralWhitener(N);
whitener.setAmount(0.6); // Default tilt amount
const visualizer = new ButterflyVisualizer();
let currentSource: IAudioSource;
let driver: IRenderLoop | null = null;
let p5Instance: p5 | null = null;

// Initialize Default
currentSource = new TestSignalSource(N);

async function startExport() {
  if (!p5Instance) return;
  if (driver) driver.stop();

  // Switch to Offline Driver
  const exportDriver = new OfflineExportLoop(
    currentSource,
    processor,
    whitener,
    visualizer,
    p5Instance
  );

  driver = exportDriver;

  exportDriver.onProgress = (percent) => {
    console.log(`Exporting: ${(percent * 100).toFixed(1)}%`);
    // We could update UI here if we exposed it
  };

  exportDriver.onComplete = (blob) => {
    console.log("Export Finished!");
    // Trigger Download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `viz_${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);

    // Restart Realtime Loop? Or just stay stopped?
    // Let's restart realtime loop for user convenience
    // But we need to switch driver back
    setTimeout(() => {
      if (p5Instance) {
        driver = new RealtimeLoop(currentSource, processor, whitener, visualizer, p5Instance);
        driver.start();
      }
    }, 1000);
  };

  driver.start();
}

// Shared AudioContext
let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioContext) {
    sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return sharedAudioContext;
}

async function switchSource(type: string) {
  if (driver) driver.stop();
  if (currentSource) currentSource.disconnect();

  // Instantiate new source
  switch (type) {
    case 'mic':
      currentSource = new MicrophoneSource(N);
      break;
    case 'file':
      currentSource = new FileAudioSource(N);
      break;
    case 'test':
    default:
      currentSource = new TestSignalSource(N);
      break;
  }

  // Initialize Source using Shared Context
  // This prevents running out of AudioContexts (max 6 usually)
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  try {
    await currentSource.initialize(ctx);
  } catch (err) {
    console.error("Failed to initialize source:", err);
    alert("Failed to initialize audio source. check permissions or file integrity.");
    return;
  }

  // Update UI via Coordinator
  // Pass export handler Only if it's a file source (checked inside coordinator too, but good to be explicit or generic)
  coordinator.updateSourceUI(currentSource, type === 'file' ? startExport : undefined);

  // Restart Driver
  if (p5Instance) {
    if (currentSource instanceof TestSignalSource) whitener.reset();
    driver = new RealtimeLoop(currentSource, processor, whitener, visualizer, p5Instance);
    driver.start();
  }
}

// UI Coordinator
const coordinator = new AppCoordinator('app', (type) => switchSource(type));

// Whitening Control UI
const tiltControl = document.createElement('div');
tiltControl.style.position = 'absolute';
tiltControl.style.bottom = '120px'; // Above source selector
tiltControl.style.left = '20px';
tiltControl.style.zIndex = '100';
tiltControl.style.color = '#fff';
tiltControl.innerHTML = `
    <label>Spectral Tilt (Whitening): <span id="tiltVal">60</span>%</label><br>
    <input type="range" min="0" max="100" value="60" id="tiltRange" style="width: 200px;">
`;
document.body.appendChild(tiltControl);

document.getElementById('tiltRange')?.addEventListener('input', (e) => {
  const val = parseInt((e.target as HTMLInputElement).value);
  document.getElementById('tiltVal')!.innerText = val.toString();
  whitener.setAmount(val / 100);
});

// Envelope Control UI
const envControl = document.createElement('div');
envControl.style.position = 'absolute';
envControl.style.bottom = '180px';
envControl.style.left = '20px';
envControl.style.zIndex = '100';
envControl.style.color = '#fff';
envControl.style.backgroundColor = 'rgba(0,0,0,0.5)';
envControl.style.padding = '10px';
envControl.style.borderRadius = '8px';

// Generate Preset Options
let presetOptions = PRESETS.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
presetOptions += `<option value="Custom">Custom</option>`;

envControl.innerHTML = `
    <strong>LED Response (ADSR)</strong><br>
    <select id="envPreset" style="margin-bottom: 5px; width: 100%;">${presetOptions}</select><br>
    
    <div style="display: grid; grid-template-columns: 60px 1fr 30px; gap: 5px; align-items: center;">
        <label>Attack</label>
        <input type="range" min="0" max="100" value="10" id="envAttack">
        <span id="valAttack">0.1</span>
        
        <label>Release</label>
        <input type="range" min="0" max="100" value="95" id="envRelease">
        <span id="valRelease">0.95</span>
        
        <label>Curve</label>
        <input type="range" min="0" max="300" value="200" id="envCurve">
        <span id="valCurve">2.0</span>
    </div>
`;
document.body.appendChild(envControl);

const envPresetSel = document.getElementById('envPreset') as HTMLSelectElement;
const envAttackIn = document.getElementById('envAttack') as HTMLInputElement;
const envReleaseIn = document.getElementById('envRelease') as HTMLInputElement;
const envCurveIn = document.getElementById('envCurve') as HTMLInputElement;

// Set default UI state (Neon)
envPresetSel.value = "Neon (Exponential)";
updateEnvSliders(PRESETS[1]);

function updateEnvSliders(cfg: EnvelopeConfig) {
  envAttackIn.value = (cfg.attackTime * 100).toString();
  envReleaseIn.value = (cfg.releaseTime * 100).toString();
  envCurveIn.value = (cfg.curveShape * 100).toString();

  document.getElementById('valAttack')!.innerText = cfg.attackTime.toFixed(2);
  document.getElementById('valRelease')!.innerText = cfg.releaseTime.toFixed(2);
  document.getElementById('valCurve')!.innerText = cfg.curveShape.toFixed(1);

  visualizer.setConfig(cfg);
}

envPresetSel.addEventListener('change', (e) => {
  const name = (e.target as HTMLSelectElement).value;
  const preset = PRESETS.find(p => p.name === name);
  if (preset) {
    updateEnvSliders(preset);
  }
});

function handleCustomEnvChange() {
  envPresetSel.value = "Custom";
  const cfg: EnvelopeConfig = {
    attackTime: parseInt(envAttackIn.value) / 100,
    releaseTime: parseInt(envReleaseIn.value) / 100,
    curveShape: parseInt(envCurveIn.value) / 100
  };

  document.getElementById('valAttack')!.innerText = cfg.attackTime.toFixed(2);
  document.getElementById('valRelease')!.innerText = cfg.releaseTime.toFixed(2);
  document.getElementById('valCurve')!.innerText = cfg.curveShape.toFixed(1);

  visualizer.setConfig(cfg);
}

envAttackIn.addEventListener('input', handleCustomEnvChange);
envReleaseIn.addEventListener('input', handleCustomEnvChange);
envCurveIn.addEventListener('input', handleCustomEnvChange);


// --- Visualizer Settings UI ---
import { VIZ_PRESETS, type ButterflyVisualizerConfig } from './visualizer/config.js';

const vizControl = document.createElement('div');
vizControl.style.position = 'absolute';
vizControl.style.bottom = '320px'; // Above Env Control
vizControl.style.left = '20px';
vizControl.style.zIndex = '100';
vizControl.style.color = '#fff';
vizControl.style.backgroundColor = 'rgba(0,0,0,0.5)';
vizControl.style.padding = '10px';
vizControl.style.borderRadius = '8px';
vizControl.style.width = '300px';

let vizPresetOptions = VIZ_PRESETS.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
vizPresetOptions += `<option value="Custom">Custom</option>`;

vizControl.innerHTML = `
    <strong>Visualizer Settings</strong><br>
    <select id="vizPreset" style="margin-bottom: 5px; width: 100%;">${vizPresetOptions}</select>
    
    <div style="font-size: 0.85em; margin-bottom: 5px;">Size</div>
    <div style="display: grid; grid-template-columns: 60px 1fr 30px; gap: 5px; align-items: center;">
        <label>Min</label><input type="range" min="0" max="20" id="vizMinSize"><span id="valMinSize"></span>
        <label>Max</label><input type="range" min="5" max="100" id="vizMaxSize"><span id="valMaxSize"></span>
        <label>Scale</label><input type="range" min="1" max="50" id="vizSizeScale"><span id="valSizeScale"></span>
    </div>

    <div style="font-size: 0.85em; margin: 5px 0;">Color</div>
    <label>Mode: <select id="vizColorMode">
        <option value="BrightnessMap">Brightness</option>
        <option value="PhaseHue">Phase Hue</option>
        <option value="FreqGradient_PhaseBrightness">Freq Gradient</option>
    </select></label>
    
    <div id="vizGroupBrightness" style="display:none; margin-top:5px;">
        <div style="display: grid; grid-template-columns: 60px 1fr 30px; gap: 5px; align-items: center;">
            <label>Red</label><input type="range" min="0" max="255" id="vizBriR"><span id="valBriR"></span>
            <label>Blue</label><input type="range" min="0" max="255" id="vizBriB"><span id="valBriB"></span>
            <label>G-Scale</label><input type="range" min="0" max="255" id="vizBriGScale"><span id="valBriGScale"></span>
        </div>
    </div>

    <div id="vizGroupSat" style="display:none; margin-top:5px;">
         <div style="display: grid; grid-template-columns: 60px 1fr 30px; gap: 5px; align-items: center;">
            <label>Sat</label><input type="range" min="0" max="100" id="vizHueSat"><span id="valHueSat"></span>
         </div>
    </div>

    <div id="vizGroupHue" style="display:none; margin-top:0px;">
        <div style="display: grid; grid-template-columns: 60px 1fr 30px; gap: 5px; align-items: center;">
            <label>Offset</label><input type="range" min="0" max="360" id="vizHueOffset"><span id="valHueOffset"></span>
            <label>BriScale</label><input type="range" min="0" max="255" id="vizHueBriScale"><span id="valHueBriScale"></span>
        </div>
    </div>

    <div id="vizGroupFreq" style="display:none; margin-top:0px;">
        <div style="display: grid; grid-template-columns: 60px 1fr 30px; gap: 5px; align-items: center;">
            <label>StartHue</label><input type="range" min="0" max="360" id="vizFreqHueStart"><span id="valFreqHueStart"></span>
            <label>EndHue</label><input type="range" min="0" max="360" id="vizFreqHueEnd"><span id="valFreqHueEnd"></span>
        </div>
    </div>
`;
document.body.appendChild(vizControl);

const vizPresetSel = document.getElementById('vizPreset') as HTMLSelectElement;
const vizColorModeSel = document.getElementById('vizColorMode') as HTMLSelectElement;
const grpBrightness = document.getElementById('vizGroupBrightness') as HTMLDivElement;
const grpSat = document.getElementById('vizGroupSat') as HTMLDivElement;
const grpHue = document.getElementById('vizGroupHue') as HTMLDivElement;
const grpFreq = document.getElementById('vizGroupFreq') as HTMLDivElement;

// Inputs
const ids = [
  'vizMinSize', 'vizMaxSize', 'vizSizeScale',
  'vizBriR', 'vizBriB', 'vizBriGScale',
  'vizHueOffset', 'vizHueSat', 'vizHueBriScale',
  'vizFreqHueStart', 'vizFreqHueEnd'
];
const inputs: Record<string, HTMLInputElement> = {};
ids.forEach(id => inputs[id] = document.getElementById(id) as HTMLInputElement);

// Init Default
updateVizUI(VIZ_PRESETS[0]);

function updateVizUI(cfg: ButterflyVisualizerConfig) {
  // Set inputs
  inputs.vizMinSize.value = cfg.minSize.toString();
  inputs.vizMaxSize.value = cfg.maxSize.toString();
  inputs.vizSizeScale.value = cfg.sizeScale.toString();

  inputs.vizBriR.value = cfg.brightnessR.toString();
  inputs.vizBriB.value = cfg.brightnessB.toString();
  inputs.vizBriGScale.value = cfg.brightnessGScale.toString();

  inputs.vizHueOffset.value = cfg.hueOffset.toString();
  inputs.vizHueSat.value = cfg.hueSaturation.toString();
  inputs.vizHueBriScale.value = cfg.hueBrightnessScale.toString();

  inputs.vizFreqHueStart.value = (cfg.freqHueStart ?? 240).toString();
  inputs.vizFreqHueEnd.value = (cfg.freqHueEnd ?? 0).toString();

  vizColorModeSel.value = cfg.colorMode;

  updateVizDisplayValues();
  updateVizGroupVisibility(cfg.colorMode);

  visualizer.importSettings(cfg);
}

function updateVizDisplayValues() {
  ids.forEach(id => {
    const span = document.getElementById(id.replace('viz', 'val'));
    if (span) span.innerText = inputs[id].value;
  });
}

function updateVizGroupVisibility(mode: string) {
  grpBrightness.style.display = 'none';
  grpSat.style.display = 'none';
  grpHue.style.display = 'none';
  grpFreq.style.display = 'none';

  if (mode === 'BrightnessMap') {
    grpBrightness.style.display = 'block';
  } else if (mode === 'PhaseHue') {
    grpSat.style.display = 'block';
    grpHue.style.display = 'block';
  } else if (mode === 'FreqGradient_PhaseBrightness') {
    grpSat.style.display = 'block';
    grpFreq.style.display = 'block';
  }
}

function getVizConfigFromUI(): ButterflyVisualizerConfig {
  return {
    name: 'Custom',
    minSize: parseInt(inputs.vizMinSize.value),
    maxSize: parseInt(inputs.vizMaxSize.value),
    sizeScale: parseInt(inputs.vizSizeScale.value),
    colorMode: vizColorModeSel.value as any,
    brightnessR: parseInt(inputs.vizBriR.value),
    brightnessB: parseInt(inputs.vizBriB.value),
    brightnessGScale: parseInt(inputs.vizBriGScale.value),
    hueOffset: parseInt(inputs.vizHueOffset.value),
    hueSaturation: parseInt(inputs.vizHueSat.value),
    hueBrightnessScale: parseInt(inputs.vizHueBriScale.value),
    freqHueStart: parseInt(inputs.vizFreqHueStart.value),
    freqHueEnd: parseInt(inputs.vizFreqHueEnd.value)
  };
}

function handleCustomVizChange() {
  vizPresetSel.value = "Custom";
  updateVizDisplayValues();
  updateVizGroupVisibility(vizColorModeSel.value);
  visualizer.importSettings(getVizConfigFromUI());
}

// Listeners
ids.forEach(id => inputs[id].addEventListener('input', handleCustomVizChange));
vizColorModeSel.addEventListener('change', handleCustomVizChange);

vizPresetSel.addEventListener('change', (e) => {
  const name = (e.target as HTMLSelectElement).value;
  const preset = VIZ_PRESETS.find(p => p.name === name);
  if (preset) {
    updateVizUI(preset);
  }
  // If Custom selected, do nothing (keep current)
});

// P5 Instance
const sketch = (p: p5) => {
  p5Instance = p;

  p.setup = async () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.noLoop(); // Driver manages loop

    visualizer.setup(p, p.width, p.height);

    // Initial Source Setup
    const ctx = getAudioContext();
    await currentSource.initialize(ctx);
    coordinator.updateSourceUI(currentSource, undefined);

    // Initial Driver Setup
    driver = new RealtimeLoop(currentSource, processor, whitener, visualizer, p);
    driver.start();
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    visualizer.resize(p.width, p.height);
  };

  // Audio Context Resume on Click (Auto-resume is often handled by browser, 
  // but explicit context.resume() is better if we have access to it)
  p.mousePressed = () => {
    // p.userStartAudio(); // Removed as it requires p5.sound
  };
};

new p5(sketch, document.getElementById('app') as HTMLElement);
