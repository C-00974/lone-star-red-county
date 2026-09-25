/**
 * Soft Open GLB preload — Quaternius CC0 horse + stable.
 * Paths resolve relative to docs/index.html on Pages.
 */
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const HORSE_URL = './assets/models/horse.glb';
const STABLE_URL = './assets/models/stable.glb';

let horseGltf = null;
let stableGltf = null;
let loadPromise = null;

function loadOne(loader, url) {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}

/** Prefetch hero assets once before Soft Open boot. */
export function preloadSoftOpenAssets() {
  if (loadPromise) return loadPromise;
  const loader = new GLTFLoader();
  loadPromise = Promise.all([
    loadOne(loader, HORSE_URL),
    loadOne(loader, STABLE_URL),
  ]).then(([horse, stable]) => {
    horseGltf = horse;
    stableGltf = stable;
    return { horseGltf, stableGltf };
  });
  return loadPromise;
}

export function getHorseGltf() {
  if (!horseGltf) throw new Error('[RED COUNTY] horse.glb not preloaded');
  return horseGltf;
}

export function getStableGltf() {
  if (!stableGltf) throw new Error('[RED COUNTY] stable.glb not preloaded');
  return stableGltf;
}

export { HORSE_URL, STABLE_URL };
