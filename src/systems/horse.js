import * as THREE from 'three';

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

/** Lathe profile points for a tapered barrel body (local Y up along length before rotate). */
function makeBodyLathe(bodyMat) {
  // Profile in XZ plane spun around Y: radius vs height — we'll rotate to lie along Z
  const pts = [
    new THREE.Vector2(0.02, -0.85),
    new THREE.Vector2(0.28, -0.75),
    new THREE.Vector2(0.38, -0.45),
    new THREE.Vector2(0.42, -0.1),
    new THREE.Vector2(0.4, 0.25),
    new THREE.Vector2(0.34, 0.55),
    new THREE.Vector2(0.26, 0.78),
    new THREE.Vector2(0.08, 0.9),
  ];
  const geo = new THREE.LatheGeometry(pts, 12);
  const mesh = new THREE.Mesh(geo, bodyMat);
  // Lathe Y = length; rotate so length runs along +Z (chest forward)
  mesh.rotation.x = Math.PI / 2;
  mesh.scale.set(1, 1.05, 0.92);
  return mesh;
}

function makeLeg(bodyMat, hoofMat) {
  const g = new THREE.Group();
  // Upper (shoulder/thigh)
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.42, 6), bodyMat);
  upper.position.y = -0.21;
  upper.castShadow = true;
  g.add(upper);
  // Knee pivot
  const knee = new THREE.Group();
  knee.position.y = -0.42;
  g.add(knee);
  const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.38, 6), bodyMat);
  lower.position.y = -0.19;
  lower.castShadow = true;
  knee.add(lower);
  const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.14), hoofMat);
  hoof.position.set(0, -0.4, 0.02);
  knee.add(hoof);
  g.userData.upper = upper;
  g.userData.knee = knee;
  return g;
}

function makeRider(darkMat, coatMat, denimMat) {
  const rider = new THREE.Group();
  rider.name = 'rider';

  // Legs straddling saddle
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.45, 0.18), denimMat);
  legL.position.set(-0.16, 0.05, 0.02);
  legL.rotation.z = 0.12;
  rider.add(legL);
  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.45, 0.18), denimMat);
  legR.position.set(0.16, 0.05, 0.02);
  legR.rotation.z = -0.12;
  rider.add(legR);

  // Boots
  const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.22), darkMat);
  bootL.position.set(-0.18, -0.22, 0.06);
  rider.add(bootL);
  const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.22), darkMat);
  bootR.position.set(0.18, -0.22, 0.06);
  rider.add(bootR);

  // Torso / coat
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.48, 0.26), coatMat);
  torso.position.set(0, 0.42, -0.02);
  torso.castShadow = true;
  rider.add(torso);

  // Shoulders
  const shoulders = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.24), coatMat);
  shoulders.position.set(0, 0.62, -0.02);
  rider.add(shoulders);

  // Arms
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 0.12), coatMat);
  armL.position.set(-0.28, 0.4, 0.08);
  armL.rotation.x = -0.55;
  rider.add(armL);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 0.12), coatMat);
  armR.position.set(0.28, 0.4, 0.08);
  armR.rotation.x = -0.55;
  rider.add(armR);

  // Neck + head
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.12, 6), coatMat);
  neck.position.set(0, 0.72, -0.02);
  rider.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), mat(0xc4a882, { roughness: 0.7 }));
  head.position.set(0, 0.88, -0.02);
  head.scale.set(1, 1.1, 0.95);
  rider.add(head);

  // Cowboy hat — crown + wide brim (silhouette, not floating cylinder)
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.16, 10), darkMat);
  crown.position.set(0, 1.02, -0.02);
  rider.add(crown);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.035, 12), darkMat);
  brim.position.set(0, 0.94, -0.02);
  rider.add(brim);
  // Slight front pinch via scaled box brim tip
  const brimFront = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.12), darkMat);
  brimFront.position.set(0, 0.94, 0.2);
  rider.add(brimFront);

  return rider;
}

/**
 * Hand-authored low-poly western horse — Lathe body, arched neck, snout head,
 * mane/tail, jointed legs. Reads as a horse from ~10m, not stacked boxes.
 */
export function createHorseMesh(profile) {
  const root = new THREE.Group();
  root.name = 'horse';

  const bodyMat = mat(profile.color);
  const maneMat = mat(profile.mane, { roughness: 0.95 });
  const dark = mat(0x1a1008, { roughness: 0.75 });
  const hoofMat = mat(0x1a120c, { roughness: 0.65 });
  const coatMat = mat(0x2a1810, { roughness: 0.85 });
  const denimMat = mat(0x2a2838, { roughness: 0.9 });

  const bodyRoot = new THREE.Group();
  bodyRoot.position.y = 1.15;
  root.add(bodyRoot);

  const body = makeBodyLathe(bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  bodyRoot.add(body);

  // Chest bulge (reads better than pure lathe from the side)
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), bodyMat);
  chest.position.set(0, -0.05, 0.55);
  chest.scale.set(1.05, 0.95, 1.15);
  chest.castShadow = true;
  bodyRoot.add(chest);

  // Haunch
  const haunch = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), bodyMat);
  haunch.position.set(0, 0.02, -0.55);
  haunch.scale.set(1.1, 1.05, 1.0);
  haunch.castShadow = true;
  bodyRoot.add(haunch);

  // Neck arch — tapered cylinder chain
  const neckGroup = new THREE.Group();
  neckGroup.position.set(0, 0.15, 0.72);
  neckGroup.rotation.x = -0.55;
  bodyRoot.add(neckGroup);

  const neck1 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.38, 8), bodyMat);
  neck1.position.y = 0.18;
  neck1.castShadow = true;
  neckGroup.add(neck1);
  const neck2 = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.32, 8), bodyMat);
  neck2.position.y = 0.48;
  neck2.rotation.x = -0.25;
  neck2.castShadow = true;
  neckGroup.add(neck2);

  // Head with snout
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.7, 0.08);
  headGroup.rotation.x = 0.35;
  neckGroup.add(headGroup);

  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.28), bodyMat);
  skull.position.set(0, 0.02, 0);
  skull.castShadow = true;
  headGroup.add(skull);

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.38), bodyMat);
  snout.position.set(0, -0.04, 0.28);
  snout.castShadow = true;
  headGroup.add(snout);

  const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.12), dark);
  muzzle.position.set(0, -0.06, 0.48);
  headGroup.add(muzzle);

  // Ears
  const earGeo = new THREE.ConeGeometry(0.05, 0.16, 5);
  const earL = new THREE.Mesh(earGeo, bodyMat);
  earL.position.set(-0.08, 0.18, -0.04);
  earL.rotation.z = -0.2;
  headGroup.add(earL);
  const earR = new THREE.Mesh(earGeo, bodyMat);
  earR.position.set(0.08, 0.18, -0.04);
  earR.rotation.z = 0.2;
  headGroup.add(earR);

  // Eyes (tiny dark)
  const eyeMat = mat(0x0a0806);
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), eyeMat);
  eyeL.position.set(-0.12, 0.05, 0.08);
  headGroup.add(eyeL);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), eyeMat);
  eyeR.position.set(0.12, 0.05, 0.08);
  headGroup.add(eyeR);

  // Mane strip along neck
  const mane = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.14), maneMat);
  mane.position.set(0, 0.42, -0.12);
  mane.rotation.x = 0.15;
  neckGroup.add(mane);
  const maneCrest = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.18, 0.22), maneMat);
  maneCrest.position.set(0, 0.12, -0.06);
  headGroup.add(maneCrest);

  // Tail
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0.15, -0.85);
  bodyRoot.add(tailGroup);
  const tail1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.45, 6), maneMat);
  tail1.position.set(0, -0.1, -0.12);
  tail1.rotation.x = 0.55;
  tail1.castShadow = true;
  tailGroup.add(tail1);
  const tail2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 0.4, 6), maneMat);
  tail2.position.set(0, -0.35, -0.32);
  tail2.rotation.x = 0.35;
  tailGroup.add(tail2);

  // Saddle
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.48), dark);
  saddle.position.set(0, 0.38, 0.02);
  bodyRoot.add(saddle);
  const saddleHorn = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.12, 6), dark);
  saddleHorn.position.set(0, 0.5, 0.18);
  bodyRoot.add(saddleHorn);
  const cantle = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.1), dark);
  cantle.position.set(0, 0.48, -0.18);
  bodyRoot.add(cantle);

  // Four legs with joints — FL, FR, BL, BR
  // Horse root: +Z forward. Leg attach under body at chest/haunch.
  const legDefs = [
    { name: 'fl', x: -0.2, z: 0.48 },
    { name: 'fr', x: 0.2, z: 0.48 },
    { name: 'bl', x: -0.22, z: -0.48 },
    { name: 'br', x: 0.22, z: -0.48 },
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
  rider.position.set(0, 1.55, 0.02);
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

  // Rest poses for legs (upper rotation.x, knee rotation.x)
  const restUpper = 0.08;
  const restKnee = 0.12;

  function update(dt, input, groundY = 0) {
    if (!state.mounted) {
      state.speed = THREE.MathUtils.damp(state.speed, 0, 12, dt);
      state.gait = 'idle';
      mesh.rider.visible = false;
      // Settle legs
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

    // Snappier accel/brake — less floaty (damp rate scales with profile)
    const accelerating = Math.abs(target) > Math.abs(state.speed) + 0.05;
    const rate = accelerating ? profile.accel : profile.brake;
    state.speed = THREE.MathUtils.damp(state.speed, target, rate * 0.55, dt);
    // Hard clamp near stop so it doesn't coast forever
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

    // Gait cycles — opposite diagonal pairs (FL+BR vs FR+BL)
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

    // legs: 0=FL, 1=FR, 2=BL, 3=BR — diagonal: FL+BR phase 0, FR+BL phase π
    const phases = [0, Math.PI, Math.PI, 0];
    mesh.legs.forEach((leg, i) => {
      const phase = state.bob + phases[i];
      const swing = Math.sin(phase) * amp * (0.45 + speedN * 0.55);
      // Gallop: more reach / stretch on front, gather on rear
      const gallopBias = state.gait === 'gallop' ? (i < 2 ? 0.12 : -0.08) : 0;
      leg.rotation.x = restUpper + swing + gallopBias * speedN;
      // Knee folds on the lift half of the cycle
      const lift = Math.max(0, Math.sin(phase));
      leg.userData.knee.rotation.x = restKnee + lift * amp * 0.85;
    });

    // Body bob + slight pitch (gallop stretch)
    const bobY = state.gait === 'idle' ? 0 : Math.abs(Math.sin(state.bob * (state.gait === 'gallop' ? 1 : 2))) * 0.06 * (0.5 + speedN);
    mesh.body.position.y = 1.15 + bobY;
    const pitch =
      state.gait === 'gallop' ? Math.sin(state.bob) * 0.08 * speedN - 0.04 * speedN :
      state.gait === 'trot' ? Math.sin(state.bob * 2) * 0.03 :
      0;
    mesh.body.rotation.x = pitch;

    // Neck follows pitch slightly
    if (mesh.neck) {
      mesh.neck.rotation.x = -0.55 + pitch * 0.6;
    }
    // Tail swish
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
