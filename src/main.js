/**
 * RED COUNTY — Soft Open Quiet vertical slice.
 * Black / blood / rust / bone. Horses. Heist. Not Golden Hour.
 */
import * as THREE from 'three';
import { createInput } from './systems/input.js';
import { HORSE_PROFILES, createHorseMesh, createHorseController } from './systems/horse.js';
import { createFollowCamera } from './systems/camera.js';
import { createHeat } from './systems/heat.js';
import { createUI } from './systems/ui.js';
import { buildGreenville, isInStreet, dist2 } from './world/greenville.js';
import { COLD_OPEN, END_CLEAN, END_BOTCHED, END_TIMEOUT } from './scenes/dialogue.js';

const WINDOW_SEC = 150;
const CASE_RADIUS = 3.0;
const DROP_RADIUS = 3.5;
const HITCH_RADIUS = 3.0;
const RAE_HINT_EVERY = 12; // seconds between distance nudges

const ui = createUI();
const canvas = document.getElementById('c');

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0508);
scene.fog = new THREE.FogExp2(0x120808, 0.018);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
const followCam = createFollowCamera(camera);

// Lighting — dusk western, rust warmth, no gold film look
const hemi = new THREE.HemisphereLight(0x6a4050, 0x1a1008, 0.55);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xc48a60, 0.85);
sun.position.set(-30, 40, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 5;
sun.shadow.camera.far = 120;
sun.shadow.camera.left = -40;
sun.shadow.camera.right = 40;
sun.shadow.camera.top = 40;
sun.shadow.camera.bottom = -40;
scene.add(sun);
const fill = new THREE.DirectionalLight(0x402030, 0.25);
fill.position.set(20, 10, -20);
scene.add(fill);

const world = buildGreenville(scene);
const heat = createHeat();

let horseCtrl = null;
let horseProfile = null;
let phase = 'title'; // title | cold | prep | play | end
let cineIndex = 0;
let carrying = false;
let windowLeft = WINDOW_SEC;
let dismountedNearHitch = false;
let promptCool = 0;
let raeBeat = 0;
let raeHintCool = 0;
let playElapsed = 0;

const input = createInput({
  touchRoot: document.getElementById('touch'),
  stickEl: document.getElementById('stick'),
  knobEl: document.getElementById('stick-knob'),
  gallopBtn: document.getElementById('btn-gallop'),
  mountBtn: document.getElementById('btn-mount'),
  actBtn: document.getElementById('btn-act'),
});

function wantTouch() {
  const q = new URLSearchParams(location.search);
  if (q.get('touch') === '1') return true;
  if (document.getElementById('opt-touch').checked) return true;
  return 'ontouchstart' in window && window.matchMedia('(pointer: coarse)').matches;
}

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);
}
window.addEventListener('resize', resize);

/** Yaw that faces spawn toward the alley case (horse: yaw 0 = +Z). */
function yawToward(from, to) {
  return Math.atan2(to.x - from.x, to.z - from.z);
}

/** Compass relative deg (0 = ahead) + distance label. */
function updateCompass(pos, yaw) {
  const target = carrying ? world.points.drop : world.points.alleyCase;
  const dx = target.x - pos.x;
  const dz = target.z - pos.z;
  const dist = Math.hypot(dx, dz);
  const worldBearing = Math.atan2(dx, dz);
  let rel = worldBearing - yaw;
  while (rel > Math.PI) rel -= Math.PI * 2;
  while (rel < -Math.PI) rel += Math.PI * 2;
  const deg = (rel * 180) / Math.PI;
  const meters = Math.max(0, Math.round(dist));
  const tag = carrying ? 'DROP' : 'CASE';
  ui.setCompass(deg, `${tag} ${meters}m`);
  return { dist, meters };
}

function grabCase() {
  if (carrying) return;
  carrying = true;
  world.hideCase();
  world.setCarrying(true);
  ui.setObjective('Ride the creek drop — watch the heat');
  ui.setPrompt("Rae: Got it. Soft wash at the creek. Don't cook the street.");
  promptCool = 3;
  raeBeat = 1;
  raeHintCool = RAE_HINT_EVERY;
}

// —— Title / menus ——
document.getElementById('btn-start').addEventListener('click', () => startColdOpen());
document.getElementById('btn-controls').addEventListener('click', () => {
  document.getElementById('panel-controls').classList.remove('hidden');
});
document.getElementById('btn-settings').addEventListener('click', () => {
  document.getElementById('panel-settings').classList.remove('hidden');
  document.getElementById('opt-touch').checked = wantTouch();
});
document.querySelectorAll('[data-close]').forEach((btn) => {
  btn.addEventListener('click', () => document.getElementById(btn.dataset.close).classList.add('hidden'));
});
document.getElementById('btn-cine-next').addEventListener('click', () => advanceCine());
document.getElementById('pick-dun').addEventListener('click', () => beginPlay('dun'));
document.getElementById('pick-bay').addEventListener('click', () => beginPlay('bay'));
document.getElementById('btn-restart').addEventListener('click', () => {
  ui.showScreen('prep');
  phase = 'prep';
});
document.getElementById('btn-title').addEventListener('click', () => {
  teardownHorse();
  phase = 'title';
  ui.showScreen('title');
  input.setTouchVisible(false);
});

function startColdOpen() {
  cineIndex = 0;
  phase = 'cold';
  ui.showScreen('cinematic');
  showCineLine();
}

function showCineLine() {
  const beat = COLD_OPEN[cineIndex];
  ui.setCine(beat.speaker, beat.line);
  document.getElementById('btn-cine-next').textContent =
    cineIndex >= COLD_OPEN.length - 1 ? 'Choose horse' : 'Continue';
}

function advanceCine() {
  cineIndex += 1;
  if (cineIndex >= COLD_OPEN.length) {
    phase = 'prep';
    ui.showScreen('prep');
    return;
  }
  showCineLine();
}

function teardownHorse() {
  if (horseCtrl) {
    scene.remove(horseCtrl.mesh.root);
    horseCtrl = null;
  }
}

function beginPlay(horseId) {
  teardownHorse();
  horseProfile = HORSE_PROFILES[horseId];
  const mesh = createHorseMesh(horseProfile);
  scene.add(mesh.root);
  horseCtrl = createHorseController(horseProfile, mesh);
  horseCtrl.pos.copy(world.points.spawn);
  // Face the alley case so first look isn't empty desert
  horseCtrl.state.yaw = yawToward(world.points.spawn, world.points.alleyCase);
  followCam.snap(mesh.root, horseCtrl.state.yaw);

  carrying = false;
  windowLeft = WINDOW_SEC;
  heat.reset();
  world.showCase();
  world.setCarrying(false);
  dismountedNearHitch = false;
  raeBeat = 0;
  promptCool = 0;
  raeHintCool = 4; // first distance hint soon
  playElapsed = 0;

  phase = 'play';
  ui.playMode();
  ui.setObjective('Reach the alley — grab the case');
  ui.setPrompt("Rae: Alley west of hitch — case glows blood.");
  input.setTouchVisible(wantTouch());
}

function finish(end) {
  phase = 'end';
  input.setTouchVisible(false);
  ui.setCompass(0, null);
  ui.showEnd(end);
}

function updatePlay(dt, sample, nowSec) {
  horseCtrl.update(dt, sample, 0);
  followCam.update(dt, horseCtrl.mesh.root, horseCtrl.state.yaw);
  playElapsed += dt;

  const pos = horseCtrl.pos;
  const nearHitch = dist2(pos, world.points.hitch) < HITCH_RADIUS;
  const nearCase = dist2(pos, world.points.alleyCase) < CASE_RADIUS;
  const nearDrop = dist2(pos, world.points.drop) < DROP_RADIUS;
  const inStreet = isInStreet(pos, world.points);
  const galloping = horseCtrl.state.gait === 'gallop';

  world.updateBeacons(nowSec);
  const { meters: objMeters } = updateCompass(pos, horseCtrl.state.yaw);

  // Mount / dismount near hitch
  if (sample.mount && nearHitch) {
    horseCtrl.state.mounted = !horseCtrl.state.mounted;
    dismountedNearHitch = !horseCtrl.state.mounted;
    ui.setPrompt(horseCtrl.state.mounted ? 'Remounted.' : 'Dismounted at hitch.');
    promptCool = 1.5;
  }

  // Grab case — Act within CASE_RADIUS works mounted OR on foot (one clear path)
  if (!carrying && nearCase && sample.act) {
    grabCase();
  }
  // Auto-grab when dismounted and standing on case
  if (!carrying && nearCase && !horseCtrl.state.mounted) {
    grabCase();
    ui.setPrompt("Rae: Case is yours. Mount up. Creek drop.");
    promptCool = 3;
  }

  // Deliver
  if (carrying && nearDrop && (sample.act || nearDrop)) {
    if (sample.act || dist2(pos, world.points.drop) < DROP_RADIUS * 0.7) {
      if (heat.isBotched()) finish(END_BOTCHED);
      else finish(END_CLEAN);
      return;
    }
  }
  // Auto-deliver when very close while carrying
  if (carrying && dist2(pos, world.points.drop) < 2.2) {
    if (heat.isBotched()) finish(END_BOTCHED);
    else finish(END_CLEAN);
    return;
  }

  heat.update(dt, {
    carrying,
    inStreet,
    galloping,
    nearDrop,
  });

  if (heat.isBotched()) {
    finish(END_BOTCHED);
    return;
  }

  windowLeft -= dt;
  if (windowLeft <= 0) {
    finish(END_TIMEOUT);
    return;
  }

  // Contextual prompts + periodic Rae distance hints
  promptCool = Math.max(0, promptCool - dt);
  raeHintCool = Math.max(0, raeHintCool - dt);

  if (promptCool <= 0) {
    if (!carrying && nearCase) {
      ui.setPrompt(horseCtrl.state.mounted
        ? 'ACT — grab the case (mounted OK)'
        : 'ACT — grab the case');
    } else if (carrying && nearDrop) {
      ui.setPrompt('ACT — drop the case in the wash');
    } else if (!carrying && nearHitch) {
      ui.setPrompt(horseCtrl.state.mounted
        ? "Rae: Alley behind the saloon — west of this hitch."
        : 'MOUNT — remount · alley is behind the saloon');
      promptCool = 2.5;
    } else if (nearHitch && horseCtrl.state.mounted && carrying) {
      ui.setPrompt('MOUNT — dismount at hitch');
    } else if (carrying && inStreet && heat.ratio() > 0.55) {
      ui.setPrompt("Rae: Heat's climbing — cut off the street.");
    } else if (!carrying && raeHintCool <= 0) {
      ui.setPrompt(`Rae: Alley west of hitch — case glows blood. (${objMeters}m)`);
      promptCool = 3.5;
      raeHintCool = RAE_HINT_EVERY;
    } else if (carrying && raeHintCool <= 0) {
      ui.setPrompt(`Rae: Soft wash ahead — drop at the rust beacon. (${objMeters}m)`);
      promptCool = 3.5;
      raeHintCool = RAE_HINT_EVERY;
    } else {
      ui.setPrompt('');
    }
  }

  ui.setMeters(
    horseCtrl.state.stamina / horseCtrl.profile.staminaMax,
    heat.ratio(),
  );
  ui.setTimer(windowLeft);
}

// Title idle — slow orbit over empty street feel
const titlePivot = new THREE.Vector3(0, 0, 8);
function updateTitle(t) {
  const a = t * 0.12;
  camera.position.set(
    Math.sin(a) * 18,
    6 + Math.sin(t * 0.2) * 0.4,
    8 + Math.cos(a) * 18,
  );
  camera.lookAt(titlePivot);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (phase === 'title' || phase === 'cold' || phase === 'prep' || phase === 'end') {
    updateTitle(now / 1000);
  } else if (phase === 'play' && horseCtrl) {
    const sample = input.sample();
    updatePlay(dt, sample, now / 1000);
  }

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// Boot
ui.showScreen('title');
input.setTouchVisible(false);
if (new URLSearchParams(location.search).get('touch') === '1') {
  document.getElementById('opt-touch').checked = true;
}
resize();
requestAnimationFrame(frame);

console.info(`[RED COUNTY] Soft Open Quiet  tip=${typeof __TIP_SHA__ !== 'undefined' ? __TIP_SHA__ : 'dev'}  build=${typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : '?'}`);
