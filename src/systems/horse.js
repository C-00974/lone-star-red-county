/**
 * Soft Open mount — Quaternius CC0 horse.glb via GLTFLoader.
 * Dun/Bay = cloned material retints. Gait = AnimationMixer clips (Idle/Walk/Gallop).
 * No procedural densify / toy mesh.
 */
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { getHorseGltf } from './assets.js';

/** Horse profiles — Dun (steady) vs Bay (sharp + burst). */
export const HORSE_PROFILES = {
  dun: {
    id: 'dun',
    name: 'Dun',
    color: 0x9a7844,
    mane: 0x3a2a18,
    coatDark: 0x7a5a30,
    coatLight: 0xb09058,
    walk: 4.2,
    trot: 7.5,
    gallop: 12.5,
    turn: 1.55,
    accel: 9.5,
    brake: 14,
    staminaMax: 100,
    staminaDrain: 18,
    staminaRegen: 14,
  },
  bay: {
    id: 'bay',
    name: 'Bay',
    color: 0x6a321c,
    mane: 0x1a0c08,
    coatDark: 0x4a2010,
    coatLight: 0x8a4830,
    walk: 4.5,
    trot: 8.2,
    gallop: 14.2,
    turn: 2.15,
    accel: 12,
    brake: 16,
    staminaMax: 82,
    staminaDrain: 26,
    staminaRegen: 12,
  },
};

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.82,
    metalness: 0.04,
    ...opts,
  });
}

/** Compact rider — mount/dismount visibility only (not the hero mesh). */
function makeRider(darkMat, coatMat, denimMat) {
  const rider = new THREE.Group();
  rider.name = 'rider';

  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.45, 0.18), denimMat);
  legL.position.set(-0.16, 0.05, 0.02);
  legL.rotation.z = 0.12;
  rider.add(legL);
  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.45, 0.18), denimMat);
  legR.position.set(0.16, 0.05, 0.02);
  legR.rotation.z = -0.12;
  rider.add(legR);

  const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.24), darkMat);
  bootL.position.set(-0.18, -0.22, 0.07);
  rider.add(bootL);
  const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.24), darkMat);
  bootR.position.set(0.18, -0.22, 0.07);
  rider.add(bootR);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.28), coatMat);
  torso.position.set(0, 0.44, -0.02);
  torso.castShadow = true;
  rider.add(torso);

  const shoulders = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.26), coatMat);
  shoulders.position.set(0, 0.64, -0.02);
  rider.add(shoulders);

  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.12), coatMat);
  armL.position.set(-0.3, 0.4, 0.08);
  armL.rotation.x = -0.55;
  rider.add(armL);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.12), coatMat);
  armR.position.set(0.3, 0.4, 0.08);
  armR.rotation.x = -0.55;
  rider.add(armR);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.13, 8), coatMat);
  neck.position.set(0, 0.74, -0.02);
  rider.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 10, 8), mat(0xc4a882, { roughness: 0.7 }));
  head.position.set(0, 0.9, -0.02);
  head.scale.set(1, 1.1, 0.95);
  rider.add(head);

  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.165, 0.17, 12), darkMat);
  crown.position.set(0, 1.04, -0.02);
  rider.add(crown);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.31, 0.035, 14), darkMat);
  brim.position.set(0, 0.96, -0.02);
  rider.add(brim);
  const brimFront = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.12), darkMat);
  brimFront.position.set(0, 0.96, 0.2);
  rider.add(brimFront);

  rider.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return rider;
}

function cloneMaterials(root) {
  const map = new Map();
  root.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    const list = Array.isArray(o.material) ? o.material : [o.material];
    const next = list.map((m) => {
      if (!map.has(m.uuid)) map.set(m.uuid, m.clone());
      return map.get(m.uuid);
    });
    o.material = Array.isArray(o.material) ? next : next[0];
  });
  return map;
}

function retintCoat(matMap, profile) {
  const byName = {};
  for (const m of matMap.values()) {
    if (m?.name) byName[m.name] = m;
  }
  const coat = new THREE.Color(profile.color);
  const dark = new THREE.Color(profile.coatDark);
  const light = new THREE.Color(profile.coatLight);
  const mane = new THREE.Color(profile.mane);

  if (byName.Main) byName.Main.color.copy(coat);
  if (byName.Main_Dark) byName.Main_Dark.color.copy(dark);
  if (byName.Main_Light) byName.Main_Light.color.copy(light);
  if (byName.Hair) byName.Hair.color.copy(mane);

  // Fallback if names differ (horse-alt style)
  if (!byName.Main) {
    for (const m of matMap.values()) {
      const n = (m.name || '').toLowerCase();
      if (n.includes('hair') || n.includes('mane')) m.color.copy(mane);
      else if (n.includes('main') || n.includes('material')) m.color.copy(coat);
    }
  }
}

function pickClip(animations, names) {
  for (const want of names) {
    const hit = animations.find((a) => a.name === want || a.name.endsWith(`|${want}`));
    if (hit) return hit;
  }
  return null;
}

/**
 * Hero mount from preloaded horse.glb.
 * Returns { root, body, rider, legs, mixer, actions, clipsOk }.
 */
export function createHorseMesh(profile) {
  const gltf = getHorseGltf();
  const root = new THREE.Group();
  root.name = 'horse';

  const model = cloneSkinned(gltf.scene);
  const matMap = cloneMaterials(model);
  retintCoat(matMap, profile);

  // Quaternius Animal Pack is oversized (~4.8u tall). Fit Soft Open strip.
  const TARGET_HEIGHT = 2.05;
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const scale = TARGET_HEIGHT / Math.max(size.y, 0.01);
  model.scale.setScalar(scale);
  // Ground feet (minY → 0)
  model.updateMatrixWorld(true);
  const grounded = new THREE.Box3().setFromObject(model);
  model.position.y -= grounded.min.y;

  model.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      if (o.isSkinnedMesh) o.frustumCulled = false;
    }
  });

  const body = new THREE.Group();
  body.name = 'horseBody';
  body.add(model);
  root.add(body);

  const dark = mat(0x1a1008, { roughness: 0.75 });
  const coatMat = mat(0x2a1810, { roughness: 0.85 });
  const denimMat = mat(0x2a2838, { roughness: 0.9 });
  const rider = makeRider(dark, coatMat, denimMat);
  // Sit on withers — Quaternius torso ~ mid height after scale
  rider.position.set(0, TARGET_HEIGHT * 0.72, size.z * scale * 0.02);
  rider.scale.setScalar(0.95);
  root.add(rider);

  // AnimationMixer on the cloned model (shares bone names with clips)
  const mixer = new THREE.AnimationMixer(model);
  const clips = {
    idle: pickClip(gltf.animations, ['Idle', 'Idle_2']),
    walk: pickClip(gltf.animations, ['Walk']),
    // No dedicated Trot in this pack — Walk at higher timeScale
    trot: pickClip(gltf.animations, ['Walk']),
    gallop: pickClip(gltf.animations, ['Gallop']),
  };
  const actions = {};
  for (const [key, clip] of Object.entries(clips)) {
    if (!clip) continue;
    // Avoid sharing Action state across Dun/Bay instances for same clip name
    const action = mixer.clipAction(clip.clone());
    action.enabled = true;
    action.setEffectiveWeight(0);
    action.play();
    actions[key] = action;
  }
  const clipsOk = !!(actions.idle && actions.walk && actions.gallop);
  if (actions.idle) {
    actions.idle.setEffectiveWeight(1);
    actions.idle.setEffectiveTimeScale(1);
  }

  // Empty legs stub — controller no longer drives procedural IK
  const legs = [];

  return {
    root,
    body,
    rider,
    legs,
    neck: null,
    head: null,
    tail: null,
    mixer,
    actions,
    clipsOk,
    model,
  };
}

export function createHorseController(profile, mesh) {
  const state = {
    mounted: true,
    yaw: 0,
    speed: 0,
    stamina: profile.staminaMax,
    gait: 'idle',
    bob: 0,
  };
  const pos = mesh.root.position;
  const tmp = new THREE.Vector3();
  let currentAction = 'idle';

  function crossfadeTo(next, fade = 0.22) {
    if (!mesh.actions || !mesh.actions[next]) return;
    if (currentAction === next) return;
    const incoming = mesh.actions[next];
    const outgoing = mesh.actions[currentAction];
    incoming.reset();
    incoming.setEffectiveWeight(1);
    incoming.play();
    if (outgoing && outgoing !== incoming) {
      outgoing.crossFadeTo(incoming, fade, false);
    } else {
      incoming.fadeIn(fade);
    }
    currentAction = next;
  }

  function update(dt, input, groundY = 0) {
    if (!state.mounted) {
      state.speed = THREE.MathUtils.damp(state.speed, 0, 12, dt);
      state.gait = 'idle';
      mesh.rider.visible = false;
      crossfadeTo('idle', 0.35);
      if (mesh.mixer) mesh.mixer.update(dt);
      // Settle body bob
      mesh.body.position.y = THREE.MathUtils.damp(mesh.body.position.y, 0, 8, dt);
      mesh.body.rotation.x = THREE.MathUtils.damp(mesh.body.rotation.x, 0, 8, dt);
      return;
    }
    mesh.rider.visible = true;

    const wantSprint = input.sprint && input.forward > 0.15 && state.stamina > 5;
    let target = 0;
    if (input.forward > 0.15) {
      if (wantSprint) target = profile.gallop;
      else if (Math.abs(input.forward) > 0.55 || Math.hypot(input.forward, input.steer) > 0.7) target = profile.trot;
      else target = profile.walk;
    } else if (input.forward < -0.15) {
      target = -profile.walk * 0.55;
    }

    const accelerating = Math.abs(target) > Math.abs(state.speed) + 0.05;
    const rate = accelerating ? profile.accel : profile.brake;
    state.speed = THREE.MathUtils.damp(state.speed, target, rate * 0.55, dt);
    if (Math.abs(target) < 0.1 && Math.abs(state.speed) < 0.35) state.speed = 0;

    const turnScale = THREE.MathUtils.clamp(1 - Math.abs(state.speed) / (profile.gallop * 1.4), 0.35, 1);
    state.yaw -= input.steer * profile.turn * turnScale * dt * (state.speed >= 0 ? 1 : -1);

    const dx = Math.sin(state.yaw) * state.speed * dt;
    const dz = Math.cos(state.yaw) * state.speed * dt;
    pos.x += dx;
    pos.z += dz;
    pos.y = groundY;

    mesh.root.rotation.y = state.yaw;

    if (wantSprint && Math.abs(state.speed) > profile.trot * 0.8) {
      state.stamina = Math.max(0, state.stamina - profile.staminaDrain * dt);
      if (state.stamina <= 0) state.speed = Math.min(state.speed, profile.trot);
    } else {
      state.stamina = Math.min(profile.staminaMax, state.stamina + profile.staminaRegen * dt);
    }

    const abs = Math.abs(state.speed);
    if (abs < 0.4) state.gait = 'idle';
    else if (abs < profile.walk * 1.15) state.gait = 'walk';
    else if (abs < profile.trot * 1.1) state.gait = 'trot';
    else state.gait = 'gallop';

    // Mixer clips + timeScale for trot (reuse Walk faster)
    if (mesh.clipsOk) {
      if (state.gait === 'idle') {
        crossfadeTo('idle');
        if (mesh.actions.idle) mesh.actions.idle.setEffectiveTimeScale(1);
      } else if (state.gait === 'walk') {
        crossfadeTo('walk');
        if (mesh.actions.walk) mesh.actions.walk.setEffectiveTimeScale(state.speed < 0 ? -0.9 : 1);
      } else if (state.gait === 'trot') {
        crossfadeTo('trot');
        if (mesh.actions.trot) mesh.actions.trot.setEffectiveTimeScale(1.55);
      } else {
        crossfadeTo('gallop');
        if (mesh.actions.gallop) mesh.actions.gallop.setEffectiveTimeScale(1);
      }
      mesh.mixer.update(dt);
      // Light root bob on top of clips so camera still feels gait
      const speedN = THREE.MathUtils.clamp(abs / profile.gallop, 0, 1);
      state.bob += (state.gait === 'gallop' ? 10 : state.gait === 'trot' ? 8 : 5) * dt;
      const bobY = state.gait === 'idle' ? 0 : Math.abs(Math.sin(state.bob)) * 0.025 * (0.4 + speedN);
      mesh.body.position.y = bobY;
      mesh.body.rotation.x = state.gait === 'gallop' ? -0.03 * speedN : 0;
    } else {
      // Fallback — root bob only (no procedural legs)
      const freq =
        state.gait === 'gallop' ? 11 :
        state.gait === 'trot' ? 8.5 :
        state.gait === 'walk' ? 5.2 : 0;
      state.bob += freq * dt;
      const speedN = THREE.MathUtils.clamp(abs / profile.gallop, 0, 1);
      const bobY = state.gait === 'idle' ? 0 : Math.abs(Math.sin(state.bob * 2)) * 0.06 * (0.5 + speedN);
      mesh.body.position.y = bobY;
      mesh.body.rotation.x =
        state.gait === 'gallop' ? Math.sin(state.bob) * 0.06 * speedN - 0.03 * speedN :
        state.gait === 'trot' ? Math.sin(state.bob * 2) * 0.025 : 0;
    }
  }

  function getWorldPos(out = tmp) {
    return out.copy(pos);
  }

  return { state, profile, mesh, update, getWorldPos, pos };
}
