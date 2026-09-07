export function phaseName(p: number): string;
export function clamp01(value: number): number;

export interface MorphApi {
  setProgress: (p: number) => void;
  scrollTo: (p: number) => void;
  getProgress: () => number;
  getPhase: () => string;
  inspect: () => {
    shown: number;
    target: number;
    running: boolean;
    disposed: boolean;
    lost: boolean;
    time: number;
    drawCalls: number;
    particles: number;
  };
  count: number;
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
