import type { IAudioSource } from './IAudioSource.js';

export type AudioSourceFactory = (size: number) => IAudioSource;

export interface RegisteredAudioSource {
    id: string;
    name: string;
    factory: AudioSourceFactory;
}

export class AudioSourceRegistry {
    private static instance: AudioSourceRegistry;
    private sources: Map<string, RegisteredAudioSource> = new Map();

    private constructor() { }

    public static getInstance(): AudioSourceRegistry {
        if (!AudioSourceRegistry.instance) {
            AudioSourceRegistry.instance = new AudioSourceRegistry();
        }
        return AudioSourceRegistry.instance;
    }

    public register(id: string, name: string, factory: AudioSourceFactory): void {
        this.sources.set(id, { id, name, factory });
    }

    public get(id: string): RegisteredAudioSource | undefined {
        return this.sources.get(id);
    }

    public getAll(): RegisteredAudioSource[] {
        return Array.from(this.sources.values());
    }

    public create(id: string, size: number): IAudioSource {
        const source = this.sources.get(id);
        if (!source) {
            throw new Error(`Audio source with id '${id}' not found.`);
        }
        return source.factory(size);
    }
}
