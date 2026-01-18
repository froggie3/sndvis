export interface Importable<T> {
    importSettings(settings: T): void;
}

export interface Exportable<T> {
    exportSettings(): T;
}
