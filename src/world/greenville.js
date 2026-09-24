import * as THREE from 'three';
import {
  makeDirtTexture,
  makeStreetTexture,
  makeWoodTexture,
  makeAdobeTexture,
  makeSignTexture,
  makeWaterTexture,
  makeCrateWoodTexture,
} from '../systems/textures.js';

/**
 * Authored Greenville strip — Soft Open fidelity pass.
 * Procedural textures, porch depth, hitch rope, saloon lettering, creek water.
 * Palette: black / blood / rust / bone. No gold film-crew chrome.
 */

const COL = {
  dirt: 0x7a5234,
  dirtDark: 0x3e2818,
  wood: 0x5a3a22,
  woodDark: 0x2e1a0e,
  adobe: 0xa08058,
  adobeDark: 0x7a5a38,
  roof: 0x4a2218,
  rust: 0x9a4824,
  bone: 0xd0c0a0,
  blood: 0xc42828,
  water: 0x2a4a48,
  brush: 0x4a5a30,
  falseFront: 0x3a2414,
};

function std(color, extras = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.88,
    metalness: 0.02,
    ...extras,
  });
}

function box(w, h, d, colorOrMat, x, y, z, matOpts = {}) {
  const material = colorOrMat.isMaterial
    ? colorOrMat
    : std(colorOrMat, matOpts);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function building(group, {
  w, h, d, x, z,
  color = COL.adobe,
  adobeMap = null,
  woodMap = null,
  roofH = 0.4,
  signTex = null,
  porch = true,
}) {
  const wallMat = adobeMap
    ? std(color, { map: adobeMap, roughnessMap: adobeMap, roughness: 0.92 })
    : std(color);
  const base = box(w, h, d, wallMat, x, h / 2, z);
  group.add(base);

  const roof = box(w + 0.35, roofH, d + 0.35, COL.roof, x, h + roofH / 2, z);
  group.add(roof);

  // False-front — depth stack (back board + face + bone trim)
  const frontH = h * 0.52;
  const frontZ = z + d / 2;
  group.add(box(w + 0.3, frontH, 0.22, COL.falseFront, x, h + frontH * 0.12, frontZ + 0.05));
  group.add(box(w + 0.2, frontH * 0.92, 0.1, 0x4a3018, x, h + frontH * 0.14, frontZ + 0.16));
  group.add(box(w + 0.4, 0.12, 0.2, COL.bone, x, h + frontH * 0.4, frontZ + 0.18, {
    emissive: 0x2a2010,
    emissiveIntensity: 0.12,
  }));
  // Cornice brackets
  for (const sx of [-w * 0.42, w * 0.42]) {
    group.add(box(0.14, 0.35, 0.28, COL.woodDark, x + sx, h + 0.15, frontZ + 0.2));
  }

  // Door recess + frame
  group.add(box(0.9, 1.85, 0.12, COL.woodDark, x, 0.92, frontZ + 0.1));
  group.add(box(1.05, 0.1, 0.14, COL.wood, x, 1.9, frontZ + 0.12));

  // Windows — warm fill (useful light, not the only light)
  const winMat = {
    emissive: 0x8a4a18,
    emissiveIntensity: 0.65,
    roughness: 0.45,
    metalness: 0.05,
  };
  group.add(box(0.58, 0.58, 0.08, 0x2a1810, x - w * 0.28, 1.6, frontZ + 0.1, winMat));
  group.add(box(0.58, 0.58, 0.08, 0x2a1810, x + w * 0.28, 1.6, frontZ + 0.1, winMat));
  // Window frames
  for (const wx of [-w * 0.28, w * 0.28]) {
    group.add(box(0.68, 0.06, 0.1, COL.bone, x + wx, 1.92, frontZ + 0.12));
    group.add(box(0.68, 0.06, 0.1, COL.bone, x + wx, 1.28, frontZ + 0.12));
  }

  // Porch posts + roof lip
  if (porch) {
    const porchZ = frontZ + 1.15;
    const woodMat = woodMap
      ? std(COL.wood, { map: woodMap, roughnessMap: woodMap })
      : std(COL.wood);
    group.add(box(w * 0.85, 0.1, 1.6, woodMat, x, 0.12, porchZ - 0.3));
    for (const sx of [-w * 0.38, w * 0.38]) {
      group.add(box(0.14, 2.4, 0.14, COL.woodDark, x + sx, 1.2, porchZ));
    }
    group.add(box(w * 0.9, 0.08, 1.7, COL.woodDark, x, 2.45, porchZ - 0.2));
  }

  if (signTex) {
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.min(w * 0.7, 4.2), 1.0),
      new THREE.MeshStandardMaterial({
        map: signTex,
        roughness: 0.7,
        metalness: 0.05,
        emissive: 0x3a1810,
        emissiveIntensity: 0.2,
      }),
    );
    sign.position.set(x, h + 0.55, frontZ + 0.28);
    sign.castShadow = true;
    group.add(sign);
  }

  return base;
}

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

  const light = new THREE.PointLight(lightColor, 1.4, 26, 1.6);
  light.position.set(0, height + 0.4, 0);
  g.add(light);

  g.userData.orb = orb;
  g.userData.tip = tip;
  g.userData.light = light;
  g.userData.baseIntensity = 1.4;
  return g;
}

/** Hitch rope — sagging tube between posts. */
function hitchRope(group, x0, y0, z0, x1, y1, z1, mat) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(x0, y0, z0),
    new THREE.Vector3((x0 + x1) / 2, Math.min(y0, y1) - 0.18, (z0 + z1) / 2),
    new THREE.Vector3(x1, y1, z1),
  ]);
  const geo = new THREE.TubeGeometry(curve, 12, 0.025, 5, false);
  const rope = new THREE.Mesh(geo, mat);
  rope.castShadow = true;
  group.add(rope);
}

export function buildGreenville(scene) {
  const root = new THREE.Group();
  root.name = 'greenville';

  const dirtMap = makeDirtTexture();
  const streetMap = makeStreetTexture();
  const woodMap = makeWoodTexture();
  const adobeMap = makeAdobeTexture();
  const adobeMapB = makeAdobeTexture(192);
  const waterMap = makeWaterTexture();
  const crateMap = makeCrateWoodTexture();
  const saloonSign = makeSignTexture('SALOON', '#7a3018', '#e8dcc8');
  const hotelSign = makeSignTexture('HOTEL', '#5a3020', '#d0c0a0');

  // Ground — textured dusty shoulders with color variation patches
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 130),
    std(COL.dirt, { map: dirtMap, roughnessMap: dirtMap, roughness: 0.96 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  // Extra ground tone patches
  for (const [px, pz, s, col] of [
    [-12, 15, 8, 0x6a4830], [14, -8, 7, 0x5a3c28], [8, 30, 9, 0x7a5538],
    [-18, -12, 6, 0x4a3020], [0, 55, 14, 0x5a4028],
  ]) {
    const patch = new THREE.Mesh(
      new THREE.CircleGeometry(s, 10),
      std(col, { roughness: 0.98 }),
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(px, 0.008, pz);
    patch.receiveShadow = true;
    root.add(patch);
  }

  const street = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 90),
    std(COL.dirtDark, { map: streetMap, roughnessMap: streetMap, roughness: 1 }),
  );
  street.rotation.x = -Math.PI / 2;
  street.position.set(0, 0.018, 10);
  street.receiveShadow = true;
  root.add(street);

  for (const x of [-4.9, 4.9]) {
    const rut = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, 88),
      std(0x5a4030, { roughness: 0.98 }),
    );
    rut.rotation.x = -Math.PI / 2;
    rut.position.set(x, 0.025, 10);
    rut.receiveShadow = true;
    root.add(rut);
  }

  // Boardwalks — wood plank texture
  const walkMat = std(COL.wood, { map: woodMap, roughnessMap: woodMap, roughness: 0.9 });
  for (const side of [-1, 1]) {
    const walk = box(2.5, 0.22, 55, walkMat, side * 6.35, 0.11, 5);
    root.add(walk);
    root.add(box(0.14, 0.3, 55, COL.woodDark, side * 5.12, 0.15, 5));
    // Plank seams (thin dark strips)
    for (let i = 0; i < 18; i++) {
      root.add(box(2.4, 0.02, 0.04, 0x2a1810, side * 6.35, 0.23, -20 + i * 3));
    }
  }

  building(root, {
    w: 8, h: 4.2, d: 7, x: -11, z: 8,
    color: COL.adobe, adobeMap, woodMap, signTex: saloonSign,
  });
  building(root, {
    w: 6, h: 3.4, d: 6, x: -10, z: -4,
    color: COL.adobeDark, adobeMap: adobeMapB, woodMap, porch: true,
  });
  building(root, {
    w: 5, h: 3.2, d: 5, x: -9.5, z: 20,
    color: 0x7a6044, adobeMap, woodMap,
  });
  building(root, {
    w: 7, h: 4.5, d: 8, x: 11, z: 6,
    color: 0x8a6a48, adobeMap: adobeMapB, woodMap, signTex: hotelSign,
  });
  building(root, {
    w: 5.5, h: 3.3, d: 5.5, x: 10.5, z: -6,
    color: COL.adobe, adobeMap, woodMap,
  });
  building(root, {
    w: 5, h: 2.8, d: 4, x: 10, z: -18,
    color: COL.wood, adobeMap: woodMap, woodMap, porch: false,
  });

  const alleyZ = 2.2;
  const alleyX = -7.2;

  const alleyFill = new THREE.PointLight(0xc47840, 0.7, 16, 1.8);
  alleyFill.position.set(-5.2, 2.4, alleyZ);
  root.add(alleyFill);
  const alleyWarm = new THREE.PointLight(0xa04828, 0.45, 12, 2);
  alleyWarm.position.set(alleyX, 1.8, alleyZ);
  root.add(alleyWarm);

  root.add(box(0.18, 2.4, 0.18, COL.woodDark, -5.4, 1.2, alleyZ + 1.6));
  root.add(box(0.18, 2.4, 0.18, COL.woodDark, -5.4, 1.2, alleyZ - 1.6));
  root.add(box(0.14, 0.14, 3.4, COL.bone, -5.4, 2.35, alleyZ, {
    emissive: 0x3a2810,
    emissiveIntensity: 0.15,
  }));

  // Alley crates — wood texture
  const crateMat = std(COL.wood, { map: crateMap, roughnessMap: crateMap });
  root.add(box(0.95, 0.95, 0.95, crateMat, alleyX - 1.2, 0.48, alleyZ));
  root.add(box(0.75, 1.15, 0.75, crateMat, alleyX - 0.3, 0.58, alleyZ - 1.1));
  root.add(box(0.7, 0.7, 0.7, crateMat, alleyX - 1.5, 0.35, alleyZ + 1.2));
  // Stacked second crate
  root.add(box(0.65, 0.55, 0.65, crateMat, alleyX - 1.2, 1.2, alleyZ));

  const barrelMat = std(COL.rust, { map: crateMap, roughness: 0.7, metalness: 0.15 });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.9, 14), barrelMat);
  barrel.position.set(alleyX + 0.5, 0.45, alleyZ + 0.8);
  barrel.castShadow = true;
  barrel.receiveShadow = true;
  root.add(barrel);
  const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.8, 14), barrelMat);
  barrel2.position.set(alleyX + 0.9, 0.4, alleyZ - 0.6);
  barrel2.castShadow = true;
  root.add(barrel2);

  const caseMesh = box(0.7, 0.36, 0.5, 0x3a2014, alleyX, 0.55, alleyZ + 0.2);
  caseMesh.name = 'case';
  root.add(caseMesh);
  const caseLid = box(0.72, 0.06, 0.52, COL.bone, alleyX, 0.76, alleyZ + 0.2, {
    emissive: 0x4a1810,
    emissiveIntensity: 0.35,
  });
  caseLid.name = 'caseLid';
  root.add(caseLid);
  const caseGlow = new THREE.PointLight(0xc42828, 1.0, 10);
  caseGlow.position.copy(caseMesh.position).add(new THREE.Vector3(0, 0.7, 0));
  root.add(caseGlow);

  const caseBeacon = makeBeacon({
    color: COL.blood,
    emissive: 0x8b1a1a,
    lightColor: 0xc42828,
    height: 5.4,
  });
  caseBeacon.position.set(alleyX, 0, alleyZ + 0.2);
  root.add(caseBeacon);

  // Hitch rail + rope
  const hitch = new THREE.Group();
  hitch.name = 'hitch';
  hitch.position.set(-4.5, 0, -2);
  hitch.add(box(0.18, 1.3, 0.18, COL.woodDark, -1.35, 0.65, 0));
  hitch.add(box(0.18, 1.3, 0.18, COL.woodDark, 1.35, 0.65, 0));
  hitch.add(box(2.9, 0.14, 0.14, COL.wood, 0, 1.18, 0));
  hitch.add(box(0.24, 0.12, 0.24, COL.bone, -1.35, 1.32, 0, { emissive: 0x2a2010, emissiveIntensity: 0.15 }));
  hitch.add(box(0.24, 0.12, 0.24, COL.bone, 1.35, 1.32, 0, { emissive: 0x2a2010, emissiveIntensity: 0.15 }));
  hitch.add(box(3.1, 0.06, 0.55, COL.woodDark, 0, 0.03, 0));
  const ropeMat = std(0x8a7050, { roughness: 0.95 });
  hitchRope(hitch, -1.3, 1.05, 0.02, 1.3, 1.05, 0.02, ropeMat);
  hitchRope(hitch, -1.3, 0.95, -0.04, 1.3, 0.95, -0.04, ropeMat);
  root.add(hitch);

  for (let z = -25; z < 40; z += 4) {
    for (const x of [-5.2, 5.2]) {
      root.add(box(0.12, 1.05, 0.12, COL.woodDark, x, 0.52, z));
      if (z % 8 === 0) {
        root.add(box(0.06, 0.06, 3.8, COL.wood, x, 0.85, z + 2));
      }
    }
  }

  root.add(box(2.2, 0.5, 0.7, COL.wood, 4.5, 0.25, -2));
  // Trough water
  const troughWater = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.08, 0.5),
    new THREE.MeshStandardMaterial({
      color: 0x3a5a58,
      roughness: 0.25,
      metalness: 0.15,
      transparent: true,
      opacity: 0.75,
    }),
  );
  troughWater.position.set(4.5, 0.48, -2);
  root.add(troughWater);

  const creekBed = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 18),
    std(0x4a3420, { map: dirtMap, roughness: 1 }),
  );
  creekBed.rotation.x = -Math.PI / 2;
  creekBed.position.set(0, -0.35, 48);
  creekBed.receiveShadow = true;
  root.add(creekBed);

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 8),
    new THREE.MeshStandardMaterial({
      color: COL.water,
      map: waterMap,
      roughness: 0.28,
      metalness: 0.25,
      transparent: true,
      opacity: 0.82,
    }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.26, 50);
  water.receiveShadow = true;
  root.add(water);
  root.userData.water = water;

  // Creek edge stones
  for (let i = 0; i < 10; i++) {
    const stone = box(
      0.5 + (i % 3) * 0.25, 0.25, 0.4 + (i % 2) * 0.2,
      0x5a4838,
      -8 + i * 1.8, 0.05, 46 + (i % 3) * 0.4,
    );
    root.add(stone);
  }

  const drop = new THREE.Group();
  drop.name = 'drop';
  drop.position.set(2, 0, 46);
  drop.add(box(2.4, 0.9, 1.2, crateMat, 0, 0.45, 0));
  drop.add(box(0.3, 0.3, 0.3, COL.bone, -0.6, 1.0, 0.2));
  const dropLight = new THREE.PointLight(0xa85a2a, 0.55, 12);
  dropLight.position.set(0, 2, 0);
  drop.add(dropLight);
  root.add(drop);

  const dropBeacon = makeBeacon({
    color: COL.rust,
    emissive: 0x6a3010,
    lightColor: 0xa85a2a,
    height: 5.0,
  });
  dropBeacon.position.copy(drop.position);
  dropBeacon.visible = false;
  root.add(dropBeacon);

  for (let i = 0; i < 14; i++) {
    const bx = Math.sin(i * 2.7) * 10;
    const bz = 42 + (i % 5) * 2.2;
    root.add(box(0.6 + (i % 3) * 0.3, 0.4, 0.5, COL.brush, bx, 0.2, bz));
  }

  // Distant buttes — adobe-ish with slight height variation
  for (const [x, z, s] of [[-35, 30, 12], [38, 55, 16], [-28, 70, 10], [30, -20, 9], [-40, 50, 8]]) {
    root.add(box(s, s * 0.55, s * 0.45, 0x6a4830, x, s * 0.22, z));
    root.add(box(s * 0.6, s * 0.25, s * 0.35, 0x5a3c28, x + s * 0.15, s * 0.55, z));
  }

  // Street lamps — fill lights (secondary, sun is primary)
  const lamp = (x, z) => {
    const l = new THREE.PointLight(0xc07840, 0.4, 18);
    l.position.set(x, 3.2, z);
    root.add(l);
    root.add(box(0.15, 2.8, 0.15, COL.woodDark, x, 1.4, z));
    root.add(box(0.38, 0.28, 0.38, COL.rust, x, 3.0, z, {
      emissive: 0x8a4020,
      emissiveIntensity: 0.7,
    }));
  };
  lamp(-6.5, 8);
  lamp(6.5, 8);
  lamp(-6.5, -8);
  lamp(6.5, 20);

  scene.add(root);

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
        caseGlow.intensity = 0.75 + Math.sin(t * 3.2) * 0.4;
      }
      // Soft water shimmer
      const w = root.userData.water;
      if (w?.material?.map) {
        w.material.map.offset.x = Math.sin(t * 0.15) * 0.02;
        w.material.map.offset.y = t * 0.02;
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
