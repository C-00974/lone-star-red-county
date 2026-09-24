import * as THREE from 'three';
import { makeLeatherTexture, makeCoatTexture } from './textures.js';

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

/**
 * Second craft pass western horse — denser lathe, layered mane, leather saddle,
 * coat noise. Reads as a mount from 10m, not Minecraft boxes.
 */
export function createHorseMesh(profile) {
  const root = new THREE.Group();
  root.name = 'horse';

  const coatMap = makeCoatTexture(profile.color);
  const leatherMap = makeLeatherTexture();
  const bodyMat = mat(profile.color, { map: coatMap, roughness: 0.78, roughnessMap: coatMap });
  const maneMat = mat(profile.mane, { roughness: 0.95 });
  const dark = mat(0x1a1008, { roughness: 0.75 });
  const leather = mat(0x3a2010, { map: leatherMap, roughness: 0.72, roughnessMap: leatherMap });
  const hoofMat = mat(0x1a120c, { roughness: 0.55, metalness: 0.08 });
  const coatMat = mat(0x2a1810, { roughness: 0.85 });
  const denimMat = mat(0x2a2838, { roughness: 0.9 });

  const bodyRoot = new THREE.Group();
  bodyRoot.position.y = 1.15;
  root.add(bodyRoot);

  const body = makeBodyLathe(bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  bodyRoot.add(body);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), bodyMat);
  chest.position.set(0, -0.04, 0.58);
  chest.scale.set(1.08, 0.98, 1.18);
  chest.castShadow = true;
  chest.receiveShadow = true;
  bodyRoot.add(chest);

  const haunch = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 10), bodyMat);
  haunch.position.set(0, 0.04, -0.58);
  haunch.scale.set(1.12, 1.08, 1.02);
  haunch.castShadow = true;
  haunch.receiveShadow = true;
  bodyRoot.add(haunch);

  // Belly fill
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), bodyMat);
  belly.position.set(0, -0.18, 0);
  belly.scale.set(0.95, 0.7, 1.35);
  bodyRoot.add(belly);

  // Neck arch
  const neckGroup = new THREE.Group();
  neckGroup.position.set(0, 0.18, 0.76);
  neckGroup.rotation.x = -0.55;
  bodyRoot.add(neckGroup);

  const neck1 = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.22, 0.4, 12), bodyMat);
  neck1.position.y = 0.2;
  neck1.castShadow = true;
  neckGroup.add(neck1);
  const neck2 = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.17, 0.34, 12), bodyMat);
  neck2.position.y = 0.52;
  neck2.rotation.x = -0.28;
  neck2.castShadow = true;
  neckGroup.add(neck2);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.74, 0.1);
  headGroup.rotation.x = 0.38;
  neckGroup.add(headGroup);

  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.3), bodyMat);
  skull.position.set(0, 0.02, 0);
  skull.castShadow = true;
  headGroup.add(skull);

  const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), bodyMat);
  cheekL.position.set(-0.12, -0.02, 0.02);
  cheekL.scale.set(0.7, 1, 1.1);
  headGroup.add(cheekL);
  const cheekR = cheekL.clone();
  cheekR.position.x = 0.12;
  headGroup.add(cheekR);

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.17, 0.4), bodyMat);
  snout.position.set(0, -0.04, 0.3);
  snout.castShadow = true;
  headGroup.add(snout);

  const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.11, 0.13), dark);
  muzzle.position.set(0, -0.06, 0.5);
  headGroup.add(muzzle);

  const nostrilL = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), dark);
  nostrilL.position.set(-0.05, -0.02, 0.55);
  headGroup.add(nostrilL);
  const nostrilR = nostrilL.clone();
  nostrilR.position.x = 0.05;
  headGroup.add(nostrilR);

  const earGeo = new THREE.ConeGeometry(0.055, 0.18, 6);
  const earL = new THREE.Mesh(earGeo, bodyMat);
  earL.position.set(-0.09, 0.2, -0.04);
  earL.rotation.z = -0.22;
  earL.rotation.x = -0.15;
  headGroup.add(earL);
  const earR = new THREE.Mesh(earGeo, bodyMat);
  earR.position.set(0.09, 0.2, -0.04);
  earR.rotation.z = 0.22;
  earR.rotation.x = -0.15;
  headGroup.add(earR);

  const eyeMat = mat(0x0a0806, { roughness: 0.3 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 6), eyeMat);
  eyeL.position.set(-0.13, 0.06, 0.1);
  headGroup.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.13;
  headGroup.add(eyeR);

  // Layered mane — multiple strips along neck crest
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const strand = new THREE.Mesh(
      new THREE.BoxGeometry(0.06 + (i % 2) * 0.02, 0.14 + t * 0.12, 0.1),
      maneMat,
    );
    strand.position.set(((i % 2) - 0.5) * 0.04, 0.22 + t * 0.42, -0.14 - t * 0.02);
    strand.rotation.x = 0.2 + t * 0.15;
    strand.castShadow = true;
    neckGroup.add(strand);
  }
  const maneCrest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.26), maneMat);
  maneCrest.position.set(0, 0.14, -0.08);
  headGroup.add(maneCrest);
  // Forelock
  const forelock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.1), maneMat);
  forelock.position.set(0, 0.08, 0.12);
  forelock.rotation.x = 0.6;
  headGroup.add(forelock);

  // Tail — fuller cascade
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0.18, -0.88);
  bodyRoot.add(tailGroup);
  const tail1 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.48, 8), maneMat);
  tail1.position.set(0, -0.12, -0.14);
  tail1.rotation.x = 0.55;
  tail1.castShadow = true;
  tailGroup.add(tail1);
  const tail2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.42, 8), maneMat);
  tail2.position.set(0, -0.38, -0.36);
  tail2.rotation.x = 0.35;
  tailGroup.add(tail2);
  const tail3 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.055, 0.28, 6), maneMat);
  tail3.position.set(0, -0.58, -0.52);
  tail3.rotation.x = 0.25;
  tailGroup.add(tail3);

  // Western saddle — leather map, skirt, stirrup straps
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.16, 0.5), leather);
  saddle.position.set(0, 0.4, 0.02);
  saddle.castShadow = true;
  bodyRoot.add(saddle);
  const skirtL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.36), leather);
  skirtL.position.set(-0.28, 0.22, 0.02);
  bodyRoot.add(skirtL);
  const skirtR = skirtL.clone();
  skirtR.position.x = 0.28;
  bodyRoot.add(skirtR);
  const saddleHorn = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.14, 8), leather);
  saddleHorn.position.set(0, 0.54, 0.2);
  bodyRoot.add(saddleHorn);
  const cantle = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.18, 0.12), leather);
  cantle.position.set(0, 0.52, -0.2);
  bodyRoot.add(cantle);
  // Stirrup irons
  for (const sx of [-0.32, 0.32]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.04), leather);
    strap.position.set(sx, 0.05, 0.08);
    bodyRoot.add(strap);
    const iron = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 10), dark);
    iron.position.set(sx, -0.14, 0.08);
    iron.rotation.y = Math.PI / 2;
    bodyRoot.add(iron);
  }
  // Blanket peek under saddle
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.04, 0.55), mat(0x6a2820, { roughness: 0.9 }));
  blanket.position.set(0, 0.32, 0.02);
  bodyRoot.add(blanket);

  const legDefs = [
    { name: 'fl', x: -0.22, z: 0.5 },
    { name: 'fr', x: 0.22, z: 0.5 },
    { name: 'bl', x: -0.24, z: -0.5 },
    { name: 'br', x: 0.24, z: -0.5 },
  ];
  const legs = [];
  for (const def of legDefs) {
    const leg = makeLeg(bodyMat, hoofMat);
    leg.name = def.name;
    leg.position.set(def.x, 1.15, def.z);
    root.add(leg);
    legs.push(leg);
  }

  const rider = makeRider(dark, coatMat, denimMat);
  rider.position.set(0, 1.58, 0.02);
  root.add(rider);

  return {
    root,
    legs,
    rider,
    body: bodyRoot,
    neck: neckGroup,
    head: headGroup,
    tail: tailGroup,
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
