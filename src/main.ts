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

  // Initialize Source
  // Note: Mic/File might require user gesture context resumption.
  await currentSource.initialize();

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

// P5 Instance
const sketch = (p: p5) => {
  p5Instance = p;

  p.setup = async () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.noLoop(); // Driver manages loop

    visualizer.setup(p, p.width, p.height);

    // Initial Source Setup
    await currentSource.initialize();
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
