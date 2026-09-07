export function phaseName(p: number): string;

export interface MorphApi {
  setProgress: (p: number) => void;
  getProgress: () => number;
  getPhase: () => string;
  ready: Promise<unknown>;
  dispose: () => void;
}

export function initMorphEngine(options?: {
  canvas?: HTMLCanvasElement | null;
  eyesSrc?: string;
  handsSrc?: string;
  onProgress?: ((p: number, phase: string) => void) | null;
  onError?: ((err: Error) => void) | null;
}): MorphApi;
