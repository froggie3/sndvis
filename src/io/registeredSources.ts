import { AudioSourceRegistry } from './AudioSourceRegistry.js';
import { FileAudioSource } from './FileAudioSource.js';
import { MicrophoneSource } from './MicrophoneSource.js';

// Setup Registry
const registry = AudioSourceRegistry.getInstance();

// Register Sources
registry.register('file', 'File Player', (size) => new FileAudioSource(size));
registry.register('mic', 'Microphone', (size) => new MicrophoneSource(size));

// We don't export anything specific, just importing this file should trigger registration
export default registry;
