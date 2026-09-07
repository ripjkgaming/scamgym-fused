import * as THREE from 'three';

// Scroll-driven particle morph, ported from particle-morph (BETWEEN study)
// with all text/UI stripped: animation only. Eyes (violet) form at the top
// of the page, disperse edge-to-edge mid-scroll, and gather into hands
// (ScamGym green) at the bottom. Scrolling up reverses it.
//
// GPU interpolation: both formations live in static attributes and the
// vertex shader blends them per frame, so only uniforms change per frame.
// Progress is owned by native page scroll; `?p=0.5` locks progress for
// screenshots and tests.

export const clamp01 = (value) => Math.max(0, Math.min(1, value));

export function phaseName(p) {
  return p < .025 ? 'eyes' : p < .3 ? 'release' : p < .7 ? 'transit' : p < .985 ? 'gather' : 'hands';
}

export function smoothProgress(state, target, dt) {
  // Exact integration of two cascaded dampers keeps velocity continuous without overshoot or frame-rate dependence.
  const step = 12 * dt, decay = Math.exp(-step);
  state.value = target + (state.value - target + (state.drive - target) * step) * decay;
  state.drive = target + (state.drive - target) * decay;
  if (Math.abs(state.value - target) < .00001 && Math.abs(state.drive - target) < .00001) {
    state.value = state.drive = target;
  }
  return state.value;
}

export function seededRandom(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6d2b79f5 | 0;
    let n = Math.imul(seed ^ seed >>> 15, 1 | seed);
    n = n + Math.imul(n ^ n >>> 7, 61 | n) ^ n;
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    const timer = setTimeout(() => { image.onload = image.onerror = null; reject(new Error('Image loading timed out. Use a local PNG or JPEG.')); }, 15000);
    image.onload = () => { clearTimeout(timer); resolve(image); };
    image.onerror = () => { clearTimeout(timer); reject(new Error('An image could not be decoded. Supply valid eyes.png and hands.png files.')); };
    image.src = src;
  });
}

export async function sampleImage(src, { mirror = false, cut = .15 } = {}) {
  const image = await loadImage(src);
  if (image.naturalWidth < 8 || image.naturalHeight < 8) throw new Error('The image is too small. Use a source at least 8 x 8 pixels, preferably 1,200 pixels wide.');
  const canvas = document.createElement('canvas');
  const crop = mirror ? [.075, .13, .85, .73] : [0, 0, 1, 1];
  const [cx, cy, cw, ch] = crop;
  const aspect = image.naturalWidth * cw / (image.naturalHeight * ch);
  canvas.width = mirror ? 800 : 640;
  canvas.height = Math.max(1, Math.round(canvas.width / (aspect * (mirror ? 2.12 : 1))));
  // Bound pathological panoramas/portraits before allocating a readback buffer.
  if (canvas.height > 2048 || canvas.height < 8) throw new Error('This image aspect ratio is too extreme. Use a landscape or portrait crop between 1:3 and 20:1.');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D pixel sampling is unavailable in this browser.');
  const draw = (width) => ctx.drawImage(image, cx * image.naturalWidth, cy * image.naturalHeight, cw * image.naturalWidth, ch * image.naturalHeight, 0, 0, width, canvas.height);
  if (mirror) {
    const width = canvas.width / 2.12;
    draw(width);
    ctx.save(); ctx.translate(canvas.width, 0); ctx.scale(-1, 1); draw(width); ctx.restore();
  } else draw(canvas.width);
  let data;
  try { data = ctx.getImageData(0, 0, canvas.width, canvas.height).data; }
  catch (error) { throw new Error(`Cannot sample image pixels. Use a same-origin or local image. ${error.message}`); }
  const w = canvas.width, h = canvas.height;
  let transparent = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 16) transparent++;
  // The mirror gap is transparent even for an opaque photograph; do not mistake it for a cutout.
  const hasMask = transparent / (w * h) > (mirror ? .1 : .02);
  const points = [];
  let minX = w, maxX = 0, minY = h, maxY = 0;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const k = (y * w + x) * 4;
      const alpha = data[k + 3] / 255;
      const light = (data[k] * .2126 + data[k + 1] * .7152 + data[k + 2] * .0722) / 255;
      if (alpha < .15 || (!hasMask && light < cut)) continue;
      const right = Math.min(k + 8, data.length - 4);
      const edge = Math.abs(light - (data[right] * .2126 + data[right + 1] * .7152 + data[right + 2] * .0722) / 255);
      const weight = alpha * (.22 + Math.sqrt(light) + Math.min(.7, edge * 3));
      points.push({ x, y, light: hasMask ? Math.max(.2, light) : light, weight });
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
  if (points.length < 16) throw new Error('No usable shape found. Use a transparent cutout or a brighter subject on a near-black background.');
  const width = maxX - minX + 2, height = maxY - minY + 2;
  const scale = Math.min(2 / width, 1.08 / height);
  for (const p of points) {
    p.x = (p.x - (minX + maxX) / 2) * scale;
    p.y = ((minY + maxY) / 2 - p.y) * scale;
  }
  return { points, cell: 2 * scale, sampleWidth: w, sampleHeight: h, hasMask };
}

export function resample(cloud, count, seed) {
  const random = seededRandom(seed);
  const candidates = cloud.points;
  const cumulative = new Float64Array(candidates.length);
  let total = 0;
  for (let i = 0; i < candidates.length; i++) cumulative[i] = total += candidates[i].weight;
  const selected = [];
  let cursor = 0;
  const offset = random();
  for (let i = 0; i < count; i++) {
    const target = (i + offset) / count * total;
    while (cursor < candidates.length - 1 && cumulative[cursor] < target) cursor++;
    const point = candidates[cursor];
    selected.push({ x: point.x + (random() - .5) * cloud.cell, y: point.y + (random() - .5) * cloud.cell, light: point.light });
  }
  // Spatial rank keeps left/right neighborhoods paired; unlike brightness rank, it has a geometric meaning.
  selected.sort((a, b) => a.x - b.x);
  const bucket = Math.ceil(Math.sqrt(count));
  for (let start = 0; start < count; start += bucket) {
    const strip = selected.slice(start, start + bucket).sort((a, b) => a.y - b.y);
    selected.splice(start, strip.length, ...strip);
  }
  const positions = new Float32Array(count * 3), light = new Float32Array(count);
  selected.forEach((p, i) => { positions.set([p.x, p.y, (p.light - .4) * .08], i * 3); light[i] = p.light; });
  return { positions, light };
}

export const vertexShader = `
  attribute vec3 aHands;
  attribute vec3 aField;
  attribute vec4 aRandom;
  attribute vec2 aLight;
  uniform float uProgress;
  uniform float uTime;
  uniform float uFit;
  uniform vec2 uViewport;
  uniform float uDpr;
  uniform float uMotion;
  uniform float uPointMax;
  varying float vLight;
  varying float vTint;
  varying float vOpacity;
  varying float vForm;

  vec3 gradient(vec3 p) {
    vec3 h = vec3(dot(p, vec3(127.1,311.7,74.7)), dot(p,vec3(269.5,183.3,246.1)), dot(p,vec3(113.5,271.9,124.6)));
    return normalize(fract(sin(h) * 43758.5453) * 2.0 - 1.0 + .0001);
  }
  float perlin(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    vec3 u = f*f*f*(f*(f*6.0-15.0)+10.0);
    return mix(mix(mix(dot(gradient(i),f), dot(gradient(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),
                   mix(dot(gradient(i+vec3(0,1,0)),f-vec3(0,1,0)),dot(gradient(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),
               mix(mix(dot(gradient(i+vec3(0,0,1)),f-vec3(0,0,1)),dot(gradient(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),
                   mix(dot(gradient(i+vec3(0,1,1)),f-vec3(0,1,1)),dot(gradient(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z);
  }
  vec3 curve(vec3 a, vec3 b, vec3 incoming, vec3 outgoing, float t) {
    float t2 = t * t, t3 = t2 * t;
    return (2.0*t3 - 3.0*t2 + 1.0)*a + (t3 - 2.0*t2 + t)*incoming
         + (-2.0*t3 + 3.0*t2)*b + (t3 - t2)*outgoing;
  }
  void main() {
    float p = uProgress + (aRandom.x - .5) * .035 * sin(uProgress * 3.14159265);
    vec3 eyes = position * uFit;
    vec3 hands = aHands * uFit;
    vec3 sides = vec3(aField.xy * uViewport, aField.z);
    vec3 center = vec3(aField.x * uViewport.x * .31, aField.y * uViewport.y * .63, aField.z * .7);
    vec3 throughSides = (center - eyes) / .7;
    vec3 throughCenter = (hands - sides) / .7;
    vec3 at;
    if (p < .3) at = curve(eyes, sides, vec3(0.0), throughSides * .3, p / .3);
    else if (p < .7) at = curve(sides, center, throughSides * .4, throughCenter * .4, (p - .3) / .4);
    else at = curve(center, hands, throughCenter * .3, vec3(0.0), (p - .7) / .3);
    float loose = smoothstep(0.0, .27, p) * (1.0 - smoothstep(.72, 1.0, p));
    float side = sign(aField.x);
    at.xy += vec2(sin(p * 6.283 + aField.y * 3.2 + side), cos(p * 6.283 + aField.y * 2.4))
           * vec2(.055, .095) * uViewport * loose;
    vec3 flowAt = at * 1.5 + aRandom.xyz * .2 + vec3(uTime * .09, -uTime * .065, uTime * .12);
    vec3 flow = vec3(perlin(flowAt), perlin(flowAt + 31.7), perlin(flowAt + 63.1));
    at += flow * (.005 * uFit + loose * min(uViewport.x,uViewport.y) * .14) * uMotion;
    at.y -= uViewport.y * .045;
    vLight = mix(aLight.x, aLight.y, smoothstep(.25, .95, p));
    vTint = aRandom.z;
    vForm = smoothstep(.25, .95, p);
    float pulse = 1.0 + .08 * sin(uTime * .8 + aRandom.w * 40.0) * uMotion;
    vOpacity = (.4 + pow(vLight, .5) * .7) * pulse * (1.0 - loose * .3);
    gl_PointSize = min(uPointMax, (3.1 + aRandom.w * 2.1 + vLight * 1.8) * uDpr * mix(1.0, .74, loose));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(at, 1.0);
  }
`;

const fragmentShader = `
  varying float vLight;
  varying float vTint;
  varying float vOpacity;
  varying float vForm;
  void main() {
    float radius = length(gl_PointCoord - .5) * 2.0;
    if (radius > 1.0) discard;
    float halo = exp(-radius * radius * 5.5) * (1.0 - smoothstep(.65, 1.0, radius));
    float core = 1.0 - smoothstep(.0, .48, radius);
    float tone = clamp(vTint * .3 + vLight, 0.0, 1.0);
    // Page top: violet. Page bottom: ScamGym green. vForm rides the same
    // .25–.95 window as the luminance blend, so color and light turn together.
    vec3 violet = mix(vec3(.30,.10,.58), vec3(.62,.42,.95), tone);
    vec3 leaf = mix(vec3(.02,.36,.22), vec3(.30,.78,.55), tone);
    vec3 color = mix(violet, leaf, vForm);
    vec3 hiCore = mix(vec3(.88,.82,1.0), vec3(.85,1.0,.90), vForm);
    color = mix(color, hiCore, core * (.45 + vLight * .55));
    gl_FragColor = vec4(color, (halo * .58 + core * .42) * vOpacity);
  }
`;

export function initMorphEngine({ canvas, eyesSrc = '/assets/eyes.png', handsSrc = '/assets/hands.png', onProgress = null, onError = null } = {}) {
  if (!canvas) throw new Error('initMorphEngine: canvas element required');
  // Animation only: the single visible fallback is a short failure note.
  const note = typeof document !== 'undefined' ? document.getElementById('morph-fallback') : null;
  let dead = false;
  const fail = (error) => {
    const message = error && error.message ? error.message : String(error);
    if (note) {
      note.style.display = 'block';
      note.textContent = `The background animation could not start. ${message}`;
    }
    try { onError?.(error instanceof Error ? error : new Error(message)); } catch { /* reporting best-effort */ }
  };

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  } catch (error) {
    fail(new Error(`WebGL2 could not start. Enable hardware acceleration or use a WebGL2-capable browser. ${error.message}`));
    throw error;
  }
  // Transparent clear: the canvas is a fixed full-viewport layer over the page.
  renderer.setClearColor(0x000000, 0);

  const count = window.innerWidth < 700 ? 4400 : 8200;
  const random = seededRandom(7712);
  const field = new Float32Array(count * 3), seeds = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    // Side fields span the viewport edges at mid-scroll, so the dispersed
    // cloud touches the left and right of the screen on any aspect ratio.
    // x is multiplied by uViewport.x (= aspect * 2) in the shader while the
    // camera half-width is `aspect`, so .36–.56 lands particles at or past
    // the visible edge instead of stopping short of it.
    const side = i < count / 2 ? -1 : 1;
    field.set([side * (.36 + random() * .20), (random() - .5) * .88, (random() - .5) * .5], i * 3);
    seeds.set([random(), random(), random(), random()], i * 4);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute('aHands', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute('aLight', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
  geometry.setAttribute('aField', new THREE.BufferAttribute(field, 3));
  geometry.setAttribute('aRandom', new THREE.BufferAttribute(seeds, 4));
  const gl = renderer.getContext();
  const reduced = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const uniforms = {
    uProgress: { value: 0 }, uTime: { value: 0 }, uFit: { value: 1 },
    uViewport: { value: new THREE.Vector2(2, 2) }, uDpr: { value: 1 },
    uMotion: { value: reduced && reduced.matches ? 0 : 1 },
    uPointMax: { value: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1] },
  };
  // Normal blending: the field sits over a light editorial page, where
  // additive light would wash out. Points carry their own violet/green color.
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader,
    transparent: true, depthWrite: false, depthTest: false });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  const scene = new THREE.Scene(); scene.add(points);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 20);
  camera.position.z = 5;

  let disposed = false, lost = false, readyToDraw = false, suspended = false;
  let raf = 0, lastTime = 0, shown = 0, target = 0, dirty = true;
  const scrollState = { value: 0, drive: 0 };
  let lastProgress = -1;
  let sampleStats = null;
  const listeners = new AbortController();
  const listen = (element, event, fn, extra = {}) => element.addEventListener(event, fn, { ...extra, signal: listeners.signal });
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  const report = (p) => {
    if (Math.abs(p - lastProgress) > .0001 || phaseName(p) !== phaseName(lastProgress)) {
      lastProgress = p;
      try { onProgress?.(p, phaseName(p)); } catch { /* consumer best-effort */ }
    }
  };

  renderer.debug.onShaderError = (context, program, vertex, fragment) => {
    fail(new Error(`Particle shader compilation failed: ${context.getProgramInfoLog(program)} ${context.getShaderInfoLog(vertex)} ${context.getShaderInfoLog(fragment)}`));
  };

  // Progress lock for screenshots/tests: `?p=0.5` holds the formation still.
  let locked = null;
  try {
    const lockedParam = new URLSearchParams(window.location.search).get('p');
    if (lockedParam !== null) locked = clamp01(parseFloat(lockedParam) || 0);
  } catch { /* location unavailable; scroll owns progress */ }

  function measure() {
    if (locked !== null) { target = locked; dirty = false; return; }
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    target = clamp01(window.scrollY / max);
    dirty = false;
  }

  function fit() {
    // Fullscreen: the canvas is the viewport, so size from the window and
    // fit the orthographic frustum to it. Side fields use viewport units,
    // so the dispersed cloud always spans edge to edge.
    const w = window.innerWidth, h = window.innerHeight, aspect = w / Math.max(1, h);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    camera.left = -aspect; camera.right = aspect; camera.top = 1; camera.bottom = -1;
    camera.updateProjectionMatrix();
    uniforms.uViewport.value.set(aspect * 2, 2);
    uniforms.uFit.value = Math.min(aspect * (w < 700 ? .85 : .80), 1.12);
    uniforms.uDpr.value = dpr * (w < 700 ? .78 : 1);
    measure();
  }

  function tick(now) {
    raf = 0;
    if (disposed || lost || suspended || document.hidden || !readyToDraw) return;
    if (dirty) measure();
    const dt = Math.min(.05, Math.max(0, (now - lastTime) / 1000)); lastTime = now;
    uniforms.uTime.value += dt;
    if (reduced && reduced.matches) shown = scrollState.value = scrollState.drive = target;
    else shown = smoothProgress(scrollState, target, dt);
    uniforms.uProgress.value = shown;
    report(shown);
    renderer.render(scene, camera);
    if (readyToDraw && (!reduced || !reduced.matches || shown !== target)) raf = requestAnimationFrame(tick);
  }

  function wake() {
    if (!raf && !disposed && !lost && !suspended && !document.hidden && readyToDraw) {
      lastTime = performance.now(); raf = requestAnimationFrame(tick);
    }
  }

  async function load() {
    // Single eye photo is cropped and mirrored into a pair; opaque photos
    // sample by luminance, transparent cutouts by alpha.
    const clouds = await Promise.all([
      sampleImage(eyesSrc, { mirror: true, cut: .12 }),
      sampleImage(handsSrc, { cut: .30 }),
    ]);
    if (disposed) return null;
    const [a, b] = clouds.map((cloud, i) => resample(cloud, count, 42 + i));
    geometry.attributes.position.array.set(a.positions);
    geometry.attributes.aHands.array.set(b.positions);
    const light = geometry.attributes.aLight.array;
    for (let i = 0; i < count; i++) { light[i * 2] = a.light[i]; light[i * 2 + 1] = b.light[i]; }
    for (const key of ['position', 'aHands', 'aLight']) geometry.attributes[key].needsUpdate = true;
    sampleStats = clouds.map((c) => ({ candidates: c.points.length, width: c.sampleWidth, height: c.sampleHeight, alphaMask: c.hasMask }));
    readyToDraw = true;
    if (locked !== null) { shown = scrollState.value = scrollState.drive = target = locked; uniforms.uProgress.value = shown; }
    report(shown);
    wake();
    return sampleStats;
  }

  listen(window, 'scroll', () => { if (locked === null) { dirty = true; wake(); } }, { passive: true });
  listen(window, 'resize', () => { fit(); wake(); });
  listen(document, 'visibilitychange', () => { if (document.hidden) stop(); else { dirty = true; wake(); } });
  if (reduced) listen(reduced, 'change', () => { uniforms.uMotion.value = reduced.matches ? 0 : 1; wake(); });
  listen(canvas, 'webglcontextlost', (event) => {
    event.preventDefault(); lost = true; stop();
    fail(new Error('The GPU context was lost. Reload the page to restart the background animation.'));
  });
  listen(window, 'pagehide', (event) => { if (event.persisted) { suspended = true; stop(); } else dispose(); });
  listen(window, 'pageshow', () => { suspended = false; dirty = true; wake(); });

  function dispose() {
    if (disposed) return;
    disposed = true; stop(); listeners.abort();
    try { geometry.dispose(); material.dispose(); renderer.dispose(); scene.clear(); } catch { /* teardown best-effort */ }
  }

  fit();
  if (locked !== null) { shown = scrollState.value = scrollState.drive = target = locked; uniforms.uProgress.value = shown; }
  else { shown = scrollState.value = scrollState.drive = target; uniforms.uProgress.value = shown; }
  report(shown);

  const ready = load().catch((error) => { fail(error); throw error; });

  const api = {
    ready, count, dispose,
    getProgress: () => shown,
    getPhase: () => phaseName(shown),
    setProgress(p) {
      if (!Number.isFinite(p)) return;
      shown = scrollState.value = scrollState.drive = target = clamp01(p);
      uniforms.uProgress.value = shown;
      report(shown);
      wake();
    },
    scrollTo(p) {
      if (!Number.isFinite(p) || disposed) return;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo({ top: clamp01(p) * max, behavior: 'instant' });
      if (locked === null) { dirty = true; wake(); }
    },
    inspect: () => ({ shown, target, running: !!raf, disposed, lost, sampleStats, time: uniforms.uTime.value,
      drawCalls: renderer.info.render.calls, particles: renderer.info.render.points,
      viewport: uniforms.uViewport.value.toArray(), fit: uniforms.uFit.value }),
  };
  window.__morph = api;
  return api;
}
