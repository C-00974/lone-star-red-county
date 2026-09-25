// WebGL renderer + post chain (MSAA target, bloom, tonemap, FXAA on low).
import * as THREE from 'three';
import { createPostChain, disposePostChain } from './postprocessing.js';
import { qualityPreset } from './quality.js';

function isMobileGpu() {
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('phone') === '1' || q.get('touch') === '1') return true;
  } catch {}
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  const touch = (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
  const small = Math.min(screen.width || 9999, screen.height || 9999) <= 920;
  return !!(coarse && touch) || (touch && small);
}

export function createRenderer(canvas) {
  const mobile = isMobileGpu();
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: mobile ? 'default' : 'high-performance',
    stencil: false,
    depth: true,
    alpha: false,
    failIfMajorPerformanceCaveat: false,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.38;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Western dusk clear — warm haze, not cave black
  renderer.setClearColor(0x2a1810, 1);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 900);
  let composer = null, bloom = null, fxaa = null, size = { w: 1, h: 1 };
  function buildComposer(scene) {
    const q = { ...qualityPreset() };
    if (mobile) {
      q.msaa = 0; q.bloom = false; q.pixelRatio = Math.min(q.pixelRatio, 1.0);
    }
    let pr = Math.min(window.devicePixelRatio || 1, q.pixelRatio);
    if (mobile) pr = Math.min(pr, 1.0);
    renderer.setPixelRatio(pr);
    let w = Math.max(1, Math.floor(size.w)), h = Math.max(1, Math.floor(size.h));
    if (mobile) {
      const maxEdge = 1280;
      const edge = Math.max(w, h);
      if (edge > maxEdge) {
        const s = maxEdge / edge;
        w = Math.max(1, Math.floor(w * s));
        h = Math.max(1, Math.floor(h * s));
      }
    }
    renderer.setSize(w, h, false);
    if (mobile) {
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    }
    disposePostChain(composer);
    if (mobile) {
      composer = null; bloom = null; fxaa = null;
    } else {
      ({ composer, bloom, fxaa } = createPostChain(renderer, scene, camera, w, h, q, { mobile }));
    }
    renderer.shadowMap.needsUpdate = true;
  }
  const api = {
    renderer, camera, mobile,
    get composer() { return composer; }, get bloom() { return bloom; },
    setScene(scene) { api.scene = scene; buildComposer(scene); },
    resize(w, h) {
      size = { w, h };
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      if (api.scene) buildComposer(api.scene);
    },
    rebuild() { if (api.scene) buildComposer(api.scene); },
    render() { composer ? composer.render() : renderer.render(api.scene, camera); },
    setBloom(strength) { if (bloom) bloom.strength = strength; },
    setExposure(e) { renderer.toneMappingExposure = e; },
    info() { return renderer.info; },
  };
  return api;
}
