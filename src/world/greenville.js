import * as THREE from 'three';

/**
 * Authored Greenville strip — dirt street, saloon block, alley + hitch, creek drop.
 * Coordinates: +Z down the street toward the creek. Origin near hitch.
 * Craft pass: brighter dusty materials, stronger false-fronts, alley mouth readable.
 */

const COL = {
  dirt: 0x7a5234,       // shoulders — lighter dusty
  dirtDark: 0x3e2818,   // street bed — darker value separation
  wood: 0x5a3a22,
  woodDark: 0x2e1a0e,
  adobe: 0xa08058,      // brighter dusty adobe (still western, not washed)
  adobeDark: 0x7a5a38,
  roof: 0x4a2218,
  rust: 0x9a4824,
  bone: 0xd0c0a0,
  blood: 0xc42828,
  water: 0x2a4a48,
  brush: 0x4a5a30,
  night: 0x0a080c,
  falseFront: 0x3a2414,
};

function box(w, h, d, color, x, y, z, matOpts = {}) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0.02, ...matOpts }),
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function building(group, { w, h, d, x, z, color = COL.adobe, roofH = 0.4, signColor = null }) {
  const base = box(w, h, d, color, x, h / 2, z);
  group.add(base);
  const roof = box(w + 0.3, roofH, d + 0.3, COL.roof, x, h + roofH / 2, z);
  group.add(roof);
  // Stronger false-front silhouette — taller board + bone trim edge
  const frontH = h * 0.48;
  const front = box(w + 0.25, frontH, 0.16, COL.falseFront, x, h + frontH * 0.15, z + d / 2 + 0.08);
  group.add(front);
  // Bone edge trim so false-front reads against sky
  group.add(box(w + 0.35, 0.1, 0.18, COL.bone, x, h + frontH * 0.38, z + d / 2 + 0.1, {
    emissive: 0x2a2010,
    emissiveIntensity: 0.15,
  }));
  // door — darker recess
  group.add(box(0.75, 1.7, 0.1, COL.woodDark, x, 0.85, z + d / 2 + 0.08));
  // windows — warm glow so buildings read as inhabited at dusk
  const winMat = { emissive: 0x6a3a18, emissiveIntensity: 0.45, roughness: 0.55 };
  group.add(box(0.55, 0.55, 0.08, 0x2a1810, x - w * 0.28, 1.55, z + d / 2 + 0.08, winMat));
  group.add(box(0.55, 0.55, 0.08, 0x2a1810, x + w * 0.28, 1.55, z + d / 2 + 0.08, winMat));
  if (signColor != null) {
    group.add(box(Math.min(w * 0.55, 3.8), 0.75, 0.18, signColor, x, h + 0.35, z + d / 2 + 0.2, {
      emissive: signColor,
      emissiveIntensity: 0.25,
    }));
  }
  return base;
}

/** Tall thin world beacon — bone post + blood/rust tip + emissive orb + point light. */
function makeBeacon({ color, emissive, lightColor, height = 5.2 }) {
  const g = new THREE.Group();
  g.name = 'beacon';

  const post = box(0.12, height, 0.12, COL.bone, 0, height / 2, 0);
  post.castShadow = false;
  g.add(post);

  const tip = box(0.28, 0.45, 0.28, color, 0, height + 0.1, 0, {
    emissive,
    emissiveIntensity: 0.85,
    roughness: 0.45,
  });
  tip.castShadow = false;
  g.add(tip);

  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 10, 8),
    new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity: 1.2,
      roughness: 0.35,
      metalness: 0.1,
    }),
  );
  orb.position.set(0, height + 0.55, 0);
  orb.castShadow = false;
  g.add(orb);

  const light = new THREE.PointLight(lightColor, 1.6, 28, 1.6);
  light.position.set(0, height + 0.4, 0);
  g.add(light);

  g.userData.orb = orb;
  g.userData.tip = tip;
  g.userData.light = light;
  g.userData.baseIntensity = 1.6;
  return g;
}

export function buildGreenville(scene) {
  const root = new THREE.Group();
  root.name = 'greenville';

  // Ground — lighter dusty shoulders
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 120),
    new THREE.MeshStandardMaterial({ color: COL.dirt, roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  // Street darker strip — clear value separation from shoulders
  const street = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 90),
    new THREE.MeshStandardMaterial({ color: COL.dirtDark, roughness: 1 }),
  );
  street.rotation.x = -Math.PI / 2;
  street.position.set(0, 0.015, 10);
  street.receiveShadow = true;
  root.add(street);

  // Street edge ruts (thin bone-dust lines) to read the road bed
  for (const x of [-4.9, 4.9]) {
    const rut = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 88),
      new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.98 }),
    );
    rut.rotation.x = -Math.PI / 2;
    rut.position.set(x, 0.02, 10);
    rut.receiveShadow = true;
    root.add(rut);
  }

  // Boardwalks — raised, lighter wood so they silhouette
  for (const side of [-1, 1]) {
    const walk = box(2.4, 0.22, 55, COL.wood, side * 6.3, 0.11, 5);
    root.add(walk);
    // Plank lip facing street
    root.add(box(0.12, 0.28, 55, COL.woodDark, side * 5.15, 0.14, 5));
  }

  // Saloon block (west side, -X) — rust sign
  building(root, { w: 8, h: 4.2, d: 7, x: -11, z: 8, color: COL.adobe, signColor: COL.rust });

  // Mercantile
  building(root, { w: 6, h: 3.4, d: 6, x: -10, z: -4, color: COL.adobeDark });

  // Sheriff lean-to / empty office
  building(root, { w: 5, h: 3.2, d: 5, x: -9.5, z: 20, color: 0x7a6044 });

  // East side — hotel / rooms
  building(root, { w: 7, h: 4.5, d: 8, x: 11, z: 6, color: 0x8a6a48 });
  building(root, { w: 5.5, h: 3.3, d: 5.5, x: 10.5, z: -6, color: COL.adobe });

  // Stable shed (near hitch)
  building(root, { w: 5, h: 2.8, d: 4, x: 10, z: -18, color: COL.wood });

  // Alley between saloon and mercantile (west) — case spawn
  const alleyZ = 2.2;
  const alleyX = -7.2;

  // Alley mouth gap lighting — obvious from spawn
  const alleyFill = new THREE.PointLight(0xc46840, 0.85, 16, 1.8);
  alleyFill.position.set(-5.2, 2.4, alleyZ);
  root.add(alleyFill);
  const alleyWarm = new THREE.PointLight(0xa04028, 0.55, 12, 2);
  alleyWarm.position.set(alleyX, 1.8, alleyZ);
  root.add(alleyWarm);
  // Mouth posts frame the gap
  root.add(box(0.18, 2.4, 0.18, COL.woodDark, -5.4, 1.2, alleyZ + 1.6));
  root.add(box(0.18, 2.4, 0.18, COL.woodDark, -5.4, 1.2, alleyZ - 1.6));
  root.add(box(0.14, 0.14, 3.4, COL.bone, -5.4, 2.35, alleyZ, {
    emissive: 0x3a2810,
    emissiveIntensity: 0.2,
  }));

  // crates / barrels in alley
  root.add(box(0.9, 0.9, 0.9, COL.wood, alleyX - 1.2, 0.45, alleyZ));
  root.add(box(0.7, 1.1, 0.7, COL.woodDark, alleyX - 0.3, 0.55, alleyZ - 1.1));
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.85, 10),
    new THREE.MeshStandardMaterial({ color: COL.rust, roughness: 0.75 }),
  );
  barrel.position.set(alleyX + 0.5, 0.42, alleyZ + 0.8);
  barrel.castShadow = true;
  root.add(barrel);

  // Case (pickup) — slightly larger + bone rim so it reads in dusk
  const caseMesh = box(0.7, 0.36, 0.5, 0x3a2014, alleyX, 0.55, alleyZ + 0.2);
  caseMesh.name = 'case';
  root.add(caseMesh);
  const caseLid = box(0.72, 0.06, 0.52, COL.bone, alleyX, 0.76, alleyZ + 0.2, {
    emissive: 0x4a1810,
    emissiveIntensity: 0.35,
  });
  caseLid.name = 'caseLid';
  root.add(caseLid);
  const caseGlow = new THREE.PointLight(0xc42828, 1.1, 10);
  caseGlow.position.copy(caseMesh.position).add(new THREE.Vector3(0, 0.7, 0));
  root.add(caseGlow);

  // Case world beacon — tall bone/blood post readable from the street
  const caseBeacon = makeBeacon({
    color: COL.blood,
    emissive: 0x8b1a1a,
    lightColor: 0xc42828,
    height: 5.4,
  });
  caseBeacon.position.set(alleyX, 0, alleyZ + 0.2);
  root.add(caseBeacon);

  // Hitch rail — stronger silhouette near alley mouth / street edge
  const hitch = new THREE.Group();
  hitch.name = 'hitch';
  hitch.position.set(-4.5, 0, -2);
  // Thicker posts + crossbar + bone tip caps
  hitch.add(box(0.16, 1.25, 0.16, COL.woodDark, -1.3, 0.62, 0));
  hitch.add(box(0.16, 1.25, 0.16, COL.woodDark, 1.3, 0.62, 0));
  hitch.add(box(2.8, 0.12, 0.12, COL.wood, 0, 1.15, 0));
  hitch.add(box(0.22, 0.12, 0.22, COL.bone, -1.3, 1.28, 0, { emissive: 0x2a2010, emissiveIntensity: 0.2 }));
  hitch.add(box(0.22, 0.12, 0.22, COL.bone, 1.3, 1.28, 0, { emissive: 0x2a2010, emissiveIntensity: 0.2 }));
  // Small ground ring so hitch reads from horseback
  hitch.add(box(3.0, 0.06, 0.5, COL.woodDark, 0, 0.03, 0));
  root.add(hitch);

  // Fence posts along street
  for (let z = -25; z < 40; z += 4) {
    for (const x of [-5.2, 5.2]) {
      root.add(box(0.12, 1.05, 0.12, COL.woodDark, x, 0.52, z));
    }
  }

  // Watering trough
  root.add(box(2.2, 0.5, 0.7, COL.wood, 4.5, 0.25, -2));

  // Soft-wash / creek drop at +Z far end
  const creekBed = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 18),
    new THREE.MeshStandardMaterial({ color: 0x4a3420, roughness: 1 }),
  );
  creekBed.rotation.x = -Math.PI / 2;
  creekBed.position.set(0, -0.35, 48);
  creekBed.receiveShadow = true;
  root.add(creekBed);

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 8),
    new THREE.MeshStandardMaterial({ color: COL.water, roughness: 0.35, metalness: 0.2 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.28, 50);
  root.add(water);

  // Drop marker — wagon / wash stones
  const drop = new THREE.Group();
  drop.name = 'drop';
  drop.position.set(2, 0, 46);
  drop.add(box(2.4, 0.9, 1.2, COL.woodDark, 0, 0.45, 0));
  drop.add(box(0.3, 0.3, 0.3, COL.bone, -0.6, 1.0, 0.2));
  const dropLight = new THREE.PointLight(0xa85a2a, 0.7, 12);
  dropLight.position.set(0, 2, 0);
  drop.add(dropLight);
  root.add(drop);

  // Drop world beacon — rust, only while carrying
  const dropBeacon = makeBeacon({
    color: COL.rust,
    emissive: 0x6a3010,
    lightColor: 0xa85a2a,
    height: 5.0,
  });
  dropBeacon.position.copy(drop.position);
  dropBeacon.visible = false;
  root.add(dropBeacon);

  // Brush / rocks near creek
  for (let i = 0; i < 14; i++) {
    const bx = (Math.sin(i * 2.7) * 10);
    const bz = 42 + (i % 5) * 2.2;
    root.add(box(0.6 + (i % 3) * 0.3, 0.4, 0.5, COL.brush, bx, 0.2, bz));
  }

  // Distant buttes (billboard blocks) — slightly brighter so horizon reads
  for (const [x, z, s] of [[-35, 30, 12], [38, 55, 16], [-28, 70, 10], [30, -20, 9]]) {
    root.add(box(s, s * 0.6, s * 0.5, 0x5a3c28, x, s * 0.25, z));
  }

  // Ambient dust lamps — warmer/brighter for strip readability
  const lamp = (x, z) => {
    const l = new THREE.PointLight(0xc07840, 0.55, 20);
    l.position.set(x, 3.2, z);
    root.add(l);
    root.add(box(0.15, 2.8, 0.15, COL.woodDark, x, 1.4, z));
    // Lamp head glow
    root.add(box(0.35, 0.25, 0.35, COL.rust, x, 3.0, z, {
      emissive: 0x8a4020,
      emissiveIntensity: 0.55,
    }));
  };
  lamp(-6.5, 8);
  lamp(6.5, 8);
  lamp(-6.5, -8);
  lamp(6.5, 20);

  scene.add(root);

  // Key positions for gameplay
  const points = {
    spawn: new THREE.Vector3(-3.5, 0, -3),
    hitch: hitch.position.clone(),
    alleyCase: caseMesh.position.clone(),
    drop: drop.position.clone(),
    streetMinX: -5,
    streetMaxX: 5,
    streetMinZ: -20,
    streetMaxZ: 38,
  };

  function pulseBeacon(beacon, t, amp = 0.55) {
    if (!beacon.visible) return;
    const pulse = 0.65 + Math.sin(t * 3.2) * amp;
    const light = beacon.userData.light;
    const orb = beacon.userData.orb;
    const tip = beacon.userData.tip;
    if (light) light.intensity = beacon.userData.baseIntensity * pulse;
    if (orb?.material) orb.material.emissiveIntensity = 0.7 + pulse * 0.7;
    if (tip?.material) tip.material.emissiveIntensity = 0.45 + pulse * 0.5;
  }

  return {
    root,
    caseMesh,
    caseGlow,
    caseBeacon,
    dropBeacon,
    hitch,
    drop,
    points,
    hideCase() {
      caseMesh.visible = false;
      caseLid.visible = false;
      caseGlow.visible = false;
      caseBeacon.visible = false;
    },
    showCase() {
      caseMesh.visible = true;
      caseLid.visible = true;
      caseGlow.visible = true;
      caseBeacon.visible = true;
      dropBeacon.visible = false;
    },
    setCarrying(carrying) {
      dropBeacon.visible = !!carrying;
      if (carrying) {
        caseMesh.visible = false;
        caseLid.visible = false;
        caseGlow.visible = false;
        caseBeacon.visible = false;
      }
    },
    updateBeacons(t) {
      pulseBeacon(caseBeacon, t, 0.6);
      pulseBeacon(dropBeacon, t, 0.5);
      if (caseGlow.visible) {
        caseGlow.intensity = 0.85 + Math.sin(t * 3.2) * 0.45;
      }
    },
  };
}

export function isInStreet(pos, points) {
  return pos.x > points.streetMinX && pos.x < points.streetMaxX
    && pos.z > points.streetMinZ && pos.z < points.streetMaxZ;
}

export function dist2(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.hypot(dx, dz);
}
