"use client";

import { useEffect, useRef } from "react";

// Fixed full-viewport particle canvas behind the app shell.
// Eyes form at the top of the page, break to the edges mid-scroll, and
// gather into hands by the bottom. Driven by native page scroll.
// Renders nothing visible if WebGL/three.js fails or reduced-motion is set.
export default function MorphBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let api: { dispose: () => void } | null = null;
    let cancelled = false;
    (async () => {
      try {
        const { initMorphEngine } = await import("@/lib/morph-engine");
        if (cancelled) return;
        api = initMorphEngine({ canvas });
      } catch {
        /* canvas stays empty; engine surfaces its own fallback note */
      }
    })();
    return () => {
      cancelled = true;
      try {
        api?.dispose();
      } catch {
        /* teardown best-effort */
      }
    };
  }, []);

  return (
    <>
      <canvas id="morph" ref={canvasRef} aria-hidden="true" />
      <p className="morph-note" id="morph-fallback" role="status" />
    </>
  );
}
