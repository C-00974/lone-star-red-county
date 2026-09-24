import * as THREE from 'three';

/** Horse profiles — Dun (steady) vs Bay (sharp + burst). */
export const HORSE_PROFILES = {
  dun: {
    id: 'dun',
    name: 'Dun',
    color: 0x8a6a3a,
    mane: 0x3a2a18,
    walk: 4.2,
    trot: 7.5,
    gallop: 12.5,
    turn: 1.55,
    accel: 6.5,
    brake: 10,
    staminaMax: 100,
    staminaDrain: 18,
    staminaRegen: 14,
  },
  bay: {
    id: 'bay',
    name: 'Bay',
    color: 0x5a2a18,
    mane: 0x1a0c08,
    walk: 4.5,
    trot: 8.2,
    gallop: 14.2,
    turn: 2.15,
    accel: 8.5,
    brake: 11,
    staminaMax: 82,
    staminaDrain: 26,
    staminaRegen: 12,
  },
};

export function createHorseMesh(profile) {
  const root = new THREE.Group();
  root.name = 'horse';

  const bodyMat = new THREE.MeshStandardMaterial({ color: profile.color, roughness: 0.85, metalness: 0.05 });
  const maneMat = new THREE.MeshStandardMaterial({ color: profile.mane, roughness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1008, roughness: 0.7 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 1.7), bodyMat);
  body.position.y = 1.05;
  body.castShadow = true;
  root.add(body);

  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.7, 0.45), bodyMat);
  neck.position.set(0, 1.55, 0.85);
  neck.rotation.x = -0.35;
  neck.castShadow = true;
  root.add(neck);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.55), bodyMat);
  head.position.set(0, 1.85, 1.2);
  head.castShadow = true;
  root.add(head);

  const mane = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.7), maneMat);
  mane.position.set(0, 1.55, 0.55);
  root.add(mane);

  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.55), dark);
  saddle.position.set(0, 1.5, 0.05);
  root.add(saddle);

  const legs = [];
  const legGeo = new THREE.BoxGeometry(0.14, 0.75, 0.14);
  const offsets = [
    [-0.22, 0.38, 0.55],
    [0.22, 0.38, 0.55],
    [-0.22, 0.38, -0.55],
    [0.22, 0.38, -0.55],
  ];
  for (const [x, y, z] of offsets) {
    const leg = new THREE.Mesh(legGeo, bodyMat);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    root.add(leg);
    legs.push(leg);
  }

  const rider = new THREE.Group();
  rider.name = 'rider';
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.28), new THREE.MeshStandardMaterial({ color: 0x2a1810, roughness: 0.8 }));
  torso.position.y = 0.35;
  rider.add(torso);
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 8), dark);
  hat.position.y = 0.72;
  rider.add(hat);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 8), dark);
  brim.position.y = 0.66;
  rider.add(brim);
  rider.position.set(0, 1.55, 0.05);
  root.add(rider);

  return { root, legs, rider, body };
}

export function createHorseController(profile, mesh) {
  const state = {
    mounted: true,
    yaw: 0,
    speed: 0,
    stamina: profile.staminaMax,
    gait: 'idle', // idle | walk | trot | gallop
    bob: 0,
  };
  const pos = mesh.root.position;
  const tmp = new THREE.Vector3();

  function update(dt, input, groundY = 0) {
    if (!state.mounted) {
      state.speed = THREE.MathUtils.damp(state.speed, 0, 8, dt);
      state.gait = 'idle';
      mesh.rider.visible = false;
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

    const rate = Math.abs(target) > Math.abs(state.speed) ? profile.accel : profile.brake;
    state.speed = THREE.MathUtils.damp(state.speed, target, rate * 0.35, dt);

    const turnScale = THREE.MathUtils.clamp(1 - Math.abs(state.speed) / (profile.gallop * 1.4), 0.35, 1);
    state.yaw -= input.steer * profile.turn * turnScale * dt * (state.speed >= 0 ? 1 : -1);

    const dx = Math.sin(state.yaw) * state.speed * dt;
    const dz = Math.cos(state.yaw) * state.speed * dt;
    pos.x += dx;
    pos.z += dz;
    pos.y = groundY;

    mesh.root.rotation.y = state.yaw;

    // stamina
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

    // leg bob
    const freq = state.gait === 'gallop' ? 12 : state.gait === 'trot' ? 8 : state.gait === 'walk' ? 5 : 0;
    state.bob += freq * dt;
    const amp = state.gait === 'idle' ? 0 : 0.12;
    mesh.legs.forEach((leg, i) => {
      const phase = state.bob + (i % 2 === 0 ? 0 : Math.PI);
      leg.rotation.x = Math.sin(phase) * amp * (abs / profile.gallop + 0.3);
    });
    mesh.body.position.y = 1.05 + Math.abs(Math.sin(state.bob * 2)) * amp * 0.35;
  }

  function getWorldPos(out = tmp) {
    return out.copy(pos);
  }

  return { state, profile, mesh, update, getWorldPos, pos };
}
