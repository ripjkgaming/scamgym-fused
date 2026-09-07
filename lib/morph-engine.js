import * as THREE from "three";

// Image-driven dual-state particle morph.
// eyes.png forms at scroll 0, breaks to the screen edges by ~30%,
// drifts back through center, and gathers into hands.png by ~100%.
  // Both targets come from one shared sampler; per-particle pairing is
  // brightness-ordered onto shuffled hands slots so neighbours travel
  // together instead of streaking across the whole frame.

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);
// Milder S-curve for the return leg: smootherstep's flat ends stall the
// mid-scroll transit (particles sit at the edges until ~60%), smoothstep
// keeps 30→70% visibly moving without rushing the final gather.
const ease = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load image: ${src}`));
    img.src = src;
  });
}

// One sampler for both states. Draws the image into a small offscreen
// canvas, keeps pixels above a luminance cut, and hands back world-space
// points plus per-point brightness for the holo shading.
async function sampleSilhouette(src, { width = 200, cut = 0.24, worldW = 4.4, seed = 1 } = {}) {
  const img = await loadImage(src);
  const w = width;
  const h = Math.max(1, Math.round((width * img.naturalHeight) / img.naturalWidth));
  const off = document.createElement("canvas");
  off.width = w; off.height = h;
  const ctx = off.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas 2D is not available in this browser");
  ctx.drawImage(img, 0, 0, w, h);
  let data;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch (err) {
    throw new Error(`cannot read pixels from ${src} (CORS or tainted canvas): ${err.message}`);
  }
  const worldH = (worldW * h) / w;
  const rnd = mulberry32(seed);
  const pts = [];
  const lum = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const k = y * w + x;
      const L = (0.2126 * data[k * 4] + 0.7152 * data[k * 4 + 1] + 0.0722 * data[k * 4 + 2]) / 255;
      if (L < cut) continue;
      pts.push([(x + rnd()) / w, (y + rnd()) / h]);
      lum.push(L);
    }
  }
  if (!pts.length) throw new Error(`no usable shape found in ${src} — needs a brighter subject or lower cut`);
  return {
    src, pts, lum,
    count: pts.length,
    world: pts.map(([nx, ny]) => [(nx - 0.5) * worldW, (0.5 - ny) * worldH]),
  };
}

// Pair every particle with one point from each cloud: rank the eyes
// particles by brightness, then deal hands samples out in shuffled
// round-robin order (brightest-eyes first), so every hands sample is used
// ~equally and no region of hands.png is left bare. Each particle is assigned
// exactly once; neighbours in brightness order take neighbouring slots, so
// same-region particles travel together instead of scrambling.
function rankPairing(fromLum, toLum, count, seed) {
  const rnd = mulberry32(seed);
  const order = [...Array(count).keys()];
  order.sort((a, b) => fromLum[b] - fromLum[a]);
  const slots = [...Array(toLum.length).keys()];
  for (let i = slots.length - 1; i > 0; i--) {
    const j = (rnd() * (i + 1)) | 0;
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  const head = (rnd() * toLum.length) | 0;
  const claimed = new Uint8Array(count);
  const pairing = new Uint32Array(count);
  for (let r = 0; r < count; r++) {
    const s = slots[(head + r) % slots.length];
    const wob = ((rnd() * 7) | 0) - 3;
    let rr = Math.min(count - 1, Math.max(0, r + wob));
    while (claimed[order[rr]]) rr = (rr + 1) % count;
    claimed[order[rr]] = 1;
    pairing[order[rr]] = s;
  }
  return pairing;
}

export function phaseName(p) {
  if (p < 0.04) return "eyes";
  if (p < 0.30) return "disperse";
  if (p < 0.70) return "drift";
  if (p < 0.985) return "gather";
  return "hands";
}

export function initMorphEngine({ canvas, eyesSrc = "/assets/eyes.png", handsSrc = "/assets/hands.png", onProgress = null, onError = null } = {}) {
  if (!canvas) throw new Error("initMorphEngine: canvas element required");
  const note = document.getElementById("morph-fallback");
  let dead = false;
  const fail = (msg, fatal = false) => {
    dead = true;
    if (note) {
      note.style.display = "block";
      note.textContent = msg;
    }
    onError?.(new Error(msg));
    if (fatal) throw new Error(msg);
  };

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (err) {
    fail(`WebGL is not available, so the particles cannot render. (${err.message})`, true);
  }
  renderer.setClearColor(0x000000, 0);

  const isSmall = window.innerWidth < 700;
  const COUNT = isSmall ? 3200 : 5500;
  const rnd = mulberry32(20260907);

  const eyesPos = new Float32Array(COUNT * 3);
  const handsPos = new Float32Array(COUNT * 3);
  const eyesLum = new Float32Array(COUNT);
  const handsLum = new Float32Array(COUNT);
  const edgePos = new Float32Array(COUNT * 3);
  const arcVec = new Float32Array(COUNT * 3);
  const spanA = new Float32Array(COUNT);
  const spanB = new Float32Array(COUNT);
  const seeds = new Float32Array(COUNT);
  const sizes = new Float32Array(COUNT);
  const shade = new Float32Array(COUNT);
  const live = new Float32Array(COUNT * 3);

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    const side = i % 2 === 0 ? -1 : 1;
    // Side fields sit just at the screen edges, not beyond them: the visible
    // half-width here is ~2.7-2.9 world units, so 1.9-3.2 keeps the dispersed
    // cloud readable as two side fields instead of vanishing off-screen
    // (which used to stall the 30-50% transit invisibly).
    edgePos[i3] = side * (1.9 + rnd() * 1.3) + (rnd() - 0.5) * 0.6;
    edgePos[i3 + 1] = (rnd() * 2 - 1) * 2.2;
    edgePos[i3 + 2] = -1.4 + rnd() * 2.0;
    const aa = rnd() * Math.PI * 2, ar = 0.3 + rnd() * 0.65;
    arcVec[i3] = Math.cos(aa) * ar;
    arcVec[i3 + 1] = Math.sin(aa) * ar;
    arcVec[i3 + 2] = (rnd() - 0.5) * 0.7;
    spanA[i] = rnd();
    spanB[i] = rnd();
    seeds[i] = rnd();
    live[i3] = edgePos[i3]; live[i3 + 1] = edgePos[i3 + 1]; live[i3 + 2] = edgePos[i3 + 2];
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(live, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute("aShade", new THREE.BufferAttribute(shade, 1).setUsage(THREE.DynamicDrawUsage));

  const uniforms = { uTime: { value: 0 }, uPxScale: { value: 800 }, uForm: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aSeed;
      attribute float aSize;
      attribute float aShade;
      uniform float uTime;
      uniform float uPxScale;
      varying float vShade;
      varying float vSeed;
      void main() {
        vec3 p = position;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float pulse = 1.0 + 0.12 * sin(uTime * 2.2 + aSeed * 6.2831);
        gl_PointSize = aSize * pulse * uPxScale / max(0.1, -mv.z);
        vShade = aShade;
        vSeed = aSeed;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying float vShade;
      varying float vSeed;
      uniform float uForm;
      void main() {
        vec2 q = gl_PointCoord - 0.5;
        float d = length(q);
        if (d > 0.5) discard;
        float glow = smoothstep(0.5, 0.08, d);
        float core = smoothstep(0.30, 0.0, d);
        // Eyes end of the gradient: yellow. Hands end: ScamGym green.
        vec3 eyeDeep = vec3(0.72, 0.55, 0.08) * (0.35 + 0.85 * vShade);
        vec3 eyePale = vec3(1.00, 0.87, 0.45) * (0.45 + 0.85 * vShade);
        vec3 handDeep = vec3(0.03, 0.35, 0.24) * (0.35 + 0.85 * vShade);
        vec3 handPale = vec3(0.35, 0.85, 0.61) * (0.45 + 0.85 * vShade);
        float heat = clamp(core * 0.8 + vSeed * 0.25, 0.0, 1.0);
        vec3 eyeCol = mix(eyeDeep, eyePale, heat);
        vec3 handCol = mix(handDeep, handPale, heat);
        vec3 col = mix(eyeCol, handCol, uForm);
        float a = glow * (0.5 + 0.5 * core);
        gl_FragColor = vec4(col * a, a);
      }
    `,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  const rig = new THREE.Group();
  rig.add(points);
  const scene = new THREE.Scene();
  scene.add(rig);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
  camera.position.set(0, 0, 8);

  let rigScale = 1;
  function fit() {
    const w = window.innerWidth, h = window.innerHeight;
    const pr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    uniforms.uPxScale.value = (h * pr) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    const visH = 2 * 8 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    rigScale = Math.min(1.5, (visH * camera.aspect) / 5.4, visH / 4.4);
      rig.scale.setScalar(rigScale);
      rig.position.y = -0.1;
  }
  fit();

  // Shared fill: scatter raw samples across the budget by round-robin so
  // sparse and dense clouds both cover every particle without clumping.
  function spreadCloud(cloud, outPos, outLum, seed) {
    const r2 = mulberry32(seed);
    const seq = [...Array(cloud.count).keys()];
    for (let i = seq.length - 1; i > 0; i--) {
      const j = (r2() * (i + 1)) | 0;
      [seq[i], seq[j]] = [seq[j], seq[i]];
    }
    const snap = cloud.count >= COUNT
      ? seq.slice(0, COUNT)
      : [...Array(COUNT).keys()].map((i) => seq[i % seq.length]);
    for (let i = 0; i < COUNT; i++) {
      const s = snap[i];
      const i3 = i * 3;
      outPos[i3] = cloud.world[s][0] + (r2() - 0.5) * 0.02;
      outPos[i3 + 1] = cloud.world[s][1] + (r2() - 0.5) * 0.02;
      outLum[i] = cloud.lum[s];
    }
  }

  const sampler = (async () => {
    const [eyes, hands] = await Promise.all([
      sampleSilhouette(eyesSrc, { width: 235, cut: 0.22, worldW: 4.4, seed: 11 }),
      sampleSilhouette(handsSrc, { width: 260, cut: 0.30, worldW: 4.4, seed: 77 }),
    ]);
    spreadCloud(eyes, eyesPos, eyesLum, 101);
    const pair = rankPairing(eyesLum, hands.lum, COUNT, 4242);
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3, s = pair[i];
      handsPos[i3] = hands.world[s][0] + (rnd() - 0.5) * 0.02;
      handsPos[i3 + 1] = hands.world[s][1] + (rnd() - 0.5) * 0.02;
      const L = hands.lum[s];
      handsLum[i] = L;
      const depth = 0.10 + L * 0.30;
      eyesPos[i3 + 2] = 0.10 + eyesLum[i] * 0.30 + (rnd() - 0.5) * 0.05;
      handsPos[i3 + 2] = depth + (rnd() - 0.5) * 0.05;
      sizes[i] = 0.016 + rnd() * 0.020 * (0.5 + Math.max(eyesLum[i], L));
    }
    geo.attributes.aSize.needsUpdate = true;
    return { eyes: eyes.count, hands: hands.count };
  })();
  const ready = sampler.catch((err) => {
    if (!dead) fail(`Could not build the particle shapes. ${err.message}`, false);
    return err;
  });

  const pointer = { x: window.innerWidth / 2, y: window.innerHeight * 0.42, inside: false };
  const sm = { x: pointer.x, y: pointer.y };
  let rotX = 0, rotY = 0;

  function buildFrame(p, time) {
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      // Out leg: eyes -> edges over 0..0.30 with per-particle stagger.
      const tA = smoother(clamp01((p - spanA[i] * 0.10) / (0.30 - spanA[i] * 0.10)));
      // Back leg: edges -> hands over 0.30..0.985, eased milder than the out
      // leg so the 30-70% transit reads as movement, not a hold.
      const b0 = 0.30 + spanB[i] * 0.16;
      const tB = ease(clamp01((p - b0) / (0.985 - b0)));
      const bowA = Math.sin(Math.PI * tA), bowB = Math.sin(Math.PI * tB);
      const ex = eyesPos[i3], ey = eyesPos[i3 + 1], ez = eyesPos[i3 + 2];
      const sx = edgePos[i3], sy = edgePos[i3 + 1], sz = edgePos[i3 + 2];
      const ax = arcVec[i3], ay = arcVec[i3 + 1], az = arcVec[i3 + 2];
      const mx = ex + (sx - ex) * tA + ax * bowA;
      const my = ey + (sy - ey) * tA + ay * bowA;
      const mz = ez + (sz - ez) * tA + az * bowA;
      const hx = handsPos[i3], hy = handsPos[i3 + 1], hz = handsPos[i3 + 2];
      let x = mx + (hx - mx) * tB + ax * 0.45 * bowB;
      let y = my + (hy - my) * tB + ay * 0.45 * bowB;
      let z = mz + (hz - mz) * tB + az * 0.45 * bowB;
      // Idle shimmer stays roughly constant, so formed shapes keep breathing
      // instead of freezing once the scroll stops.
      const amp = 0.028 + 0.022 * Math.max(tA * (1 - tB), tB * (1 - tA));
      x += Math.sin(time * 0.7 + seeds[i] * 39.0) * amp;
      y += Math.cos(time * 0.55 + seeds[i] * 61.0) * amp;
      z += Math.sin(time * 0.5 + seeds[i] * 23.0) * amp * 0.6;
      live[i3] = x; live[i3 + 1] = y; live[i3 + 2] = z;
      shade[i] = lerp(eyesLum[i], handsLum[i], tB) * (0.55 + 0.45 * Math.sin(time * 1.4 + seeds[i] * 6.2831) * 0.5 + 0.225);
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aShade.needsUpdate = true;
    // Eyes (p=0) render purple; hands (p=1) render blue; mid-flight blends.
    uniforms.uForm.value = clamp01((p - 0.30) / (0.985 - 0.30));
  }

  let target = 0;
  let shown = 0;
  const reduceMotion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

  let raf = 0;
  let lastT = performance.now();
  let lastSent = -1;
  let lastPhase = "";

  function tick(now) {
    raf = 0;
    if (dead) return;
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    uniforms.uTime.value += dt * (reduceMotion && reduceMotion.matches ? 0.15 : 1);
    const time = uniforms.uTime.value;

    const k = Math.min(1, dt * 2.2);
    sm.x += (pointer.x - sm.x) * k;
    sm.y += (pointer.y - sm.y) * k;
    const w = window.innerWidth || 1, h = window.innerHeight || 1;
    rotY += (((sm.x / w) * 2 - 1) * 0.05 - rotY) * Math.min(1, dt * 2.2);
    rotX += ((-((sm.y / h) * 2 - 1)) * -0.03 - rotX) * Math.min(1, dt * 2.2);
    rig.rotation.y = rotY;
    rig.rotation.x = rotX;

    const gap = target - shown;
    if (Math.abs(gap) > 1e-4) {
      shown = clamp01(shown + gap * Math.min(1, dt * 4.5));
    } else if (shown !== target) {
      shown = target;
    }

    buildFrame(shown, time);
    renderer.render(scene, camera);
    const ph = phaseName(shown);
    if (onProgress && (Math.abs(shown - lastSent) > 0.0015 || ph !== lastPhase)) {
      lastSent = shown;
      lastPhase = ph;
      onProgress(shown, ph);
    }
    raf = requestAnimationFrame(tick);
  }

  function wake() {
    if (!raf && !dead) {
      lastT = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }

  function readTarget() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return 0;
    return clamp01(window.scrollY / max);
  }

  const query = new URLSearchParams(location.search);
  const lockedParam = query.get("p");
  const locked = lockedParam === null ? null : clamp01(parseFloat(lockedParam) || 0);
  target = locked !== null ? locked : readTarget();
  shown = target;

  let resizeT = 0;
  const onResize = () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { fit(); wake(); }, 120);
  };
  const onScroll = () => {
    if (locked === null) {
      target = readTarget();
      wake();
    }
  };
  const onVis = () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    } else {
      wake();
    }
  };
  const onCtxLost = (e) => {
    e.preventDefault();
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    fail("The GPU context was lost. Reload the page to restart the particles.");
  };
  const onCtxBack = () => wake();
  const onHide = () => dispose();
  const onPointerMove = (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.inside = true;
  };
  const onLeave = () => { pointer.inside = false; };

  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", onVis);
  canvas.addEventListener("webglcontextlost", onCtxLost);
  canvas.addEventListener("webglcontextrestored", onCtxBack);
  window.addEventListener("pagehide", onHide);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.documentElement.addEventListener("mouseleave", onLeave);

  function setProgress(p) {
    target = clamp01(p);
    shown = target;
    wake();
  }

  function dispose() {
    dead = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onScroll);
    document.removeEventListener("visibilitychange", onVis);
    canvas.removeEventListener("webglcontextlost", onCtxLost);
    canvas.removeEventListener("webglcontextrestored", onCtxBack);
    window.removeEventListener("pagehide", onHide);
    window.removeEventListener("pointermove", onPointerMove);
    document.documentElement.removeEventListener("mouseleave", onLeave);
    try {
      geo.dispose();
      mat.dispose();
      renderer.dispose();
    } catch { /* teardown best-effort */ }
  }

  const api = { setProgress, getProgress: () => shown, getPhase: () => phaseName(shown), ready, dispose };
  window.__morph = api;

  sampler.then(
    () => {
      buildFrame(shown, 0);
      if (onProgress) onProgress(shown, phaseName(shown));
      wake();
    },
    () => {
      // Sampler already reported via fail(); keep the scatter cloud animating
      // so the page shows drifting particles instead of a black screen.
      // Idle drift still needs sizes filled in — the sampler never ran.
      for (let i = 0; i < COUNT; i++) {
        sizes[i] = 0.016 + rnd() * 0.020;
        shade[i] = 0.35;
      }
      geo.attributes.aSize.needsUpdate = true;
      buildFrame(shown, 0);
      wake();
    }
  );
  return api;
}
