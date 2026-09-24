import * as THREE from 'three';
import { makeLeatherTexture, makeCoatTexture } from './textures.js';
import { createDenseHorseMesh } from './horseMesh.js';

/** Horse profiles — Dun (steady) vs Bay (sharp + burst). */
export const HORSE_PROFILES = {
  dun: {
    id: 'dun',
    name: 'Dun',
    color: 0x9a7844,
    mane: 0x3a2a18,
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

/** Denser lathe barrel — more profile rings + radial segments. */
function makeBodyLathe(bodyMat) {
  const pts = [
    new THREE.Vector2(0.015, -0.92),
    new THREE.Vector2(0.18, -0.88),
    new THREE.Vector2(0.3, -0.78),
    new THREE.Vector2(0.38, -0.58),
    new THREE.Vector2(0.42, -0.35),
    new THREE.Vector2(0.44, -0.12),
    new THREE.Vector2(0.43, 0.1),
    new THREE.Vector2(0.4, 0.32),
    new THREE.Vector2(0.36, 0.52),
    new THREE.Vector2(0.3, 0.7),
    new THREE.Vector2(0.22, 0.84),
    new THREE.Vector2(0.1, 0.92),
    new THREE.Vector2(0.04, 0.96),
  ];
  const geo = new THREE.LatheGeometry(pts, 20);
  const mesh = new THREE.Mesh(geo, bodyMat);
  mesh.rotation.x = Math.PI / 2;
  mesh.scale.set(1.05, 1.08, 0.95);
  return mesh;
}

function makeLeg(bodyMat, hoofMat) {
  const g = new THREE.Group();
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.082, 0.44, 8), bodyMat);
  upper.position.y = -0.22;
  upper.castShadow = true;
  upper.receiveShadow = true;
  g.add(upper);
  const knee = new THREE.Group();
  knee.position.y = -0.44;
  g.add(knee);
  const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.055, 0.4, 8), bodyMat);
  lower.position.y = -0.2;
  lower.castShadow = true;
  knee.add(lower);
  // Fetlock fluff
  const fetlock = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), bodyMat);
  fetlock.position.set(0, -0.38, 0.01);
  fetlock.scale.set(1, 0.7, 1.1);
  knee.add(fetlock);
  const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.09, 8), hoofMat);
  hoof.position.set(0, -0.44, 0.02);
  hoof.rotation.x = 0.08;
  knee.add(hoof);
  g.userData.upper = upper;
  g.userData.knee = knee;
  return g;
}

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

  return rider;
}

/** Dense GH-class procedural horse (see horseMesh.js). */
export function createHorseMesh(profile) {
  return createDenseHorseMesh(profile);
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

  const restUpper = 0.08;
  const restKnee = 0.12;

  function update(dt, input, groundY = 0) {
    if (!state.mounted) {
      state.speed = THREE.MathUtils.damp(state.speed, 0, 12, dt);
      state.gait = 'idle';
      mesh.rider.visible = false;
      mesh.legs.forEach((leg) => {
        leg.rotation.x = THREE.MathUtils.damp(leg.rotation.x, 0, 8, dt);
        leg.userData.knee.rotation.x = THREE.MathUtils.damp(leg.userData.knee.rotation.x, restKnee, 8, dt);
      });
      mesh.body.position.y = THREE.MathUtils.damp(mesh.body.position.y, 1.15, 8, dt);
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

    const freq =
      state.gait === 'gallop' ? 11 :
      state.gait === 'trot' ? 8.5 :
      state.gait === 'walk' ? 5.2 : 0;
    state.bob += freq * dt;

    const speedN = THREE.MathUtils.clamp(abs / profile.gallop, 0, 1);
    const amp =
      state.gait === 'gallop' ? 0.55 :
      state.gait === 'trot' ? 0.38 :
      state.gait === 'walk' ? 0.28 : 0;

    const phases = [0, Math.PI, Math.PI, 0];
    mesh.legs.forEach((leg, i) => {
      const phase = state.bob + phases[i];
      const swing = Math.sin(phase) * amp * (0.45 + speedN * 0.55);
      const gallopBias = state.gait === 'gallop' ? (i < 2 ? 0.12 : -0.08) : 0;
      leg.rotation.x = restUpper + swing + gallopBias * speedN;
      const lift = Math.max(0, Math.sin(phase));
      leg.userData.knee.rotation.x = restKnee + lift * amp * 0.85;
    });

    const bobY = state.gait === 'idle' ? 0 : Math.abs(Math.sin(state.bob * (state.gait === 'gallop' ? 1 : 2))) * 0.06 * (0.5 + speedN);
    mesh.body.position.y = 1.15 + bobY;
    const pitch =
      state.gait === 'gallop' ? Math.sin(state.bob) * 0.08 * speedN - 0.04 * speedN :
      state.gait === 'trot' ? Math.sin(state.bob * 2) * 0.03 :
      0;
    mesh.body.rotation.x = pitch;

    if (mesh.neck) {
      mesh.neck.rotation.x = -0.55 + pitch * 0.6;
    }
    if (mesh.tail) {
      mesh.tail.rotation.y = Math.sin(state.bob * 0.7) * 0.15 * speedN;
      mesh.tail.rotation.x = 0.1 + Math.sin(state.bob) * 0.08 * speedN;
    }
  }

  function getWorldPos(out = tmp) {
    return out.copy(pos);
  }

  return { state, profile, mesh, update, getWorldPos, pos };
}
