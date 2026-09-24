/**
 * Dense procedural western horse + rider — GH-class part count (not a lathe body).
 * Soft Open Soft Open: Dun/Bay retint, mount/dismount + gait via controller.
 */
import * as THREE from 'three';
import { makeLeatherTexture, makeCoatTexture } from './textures.js';

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color, roughness: 0.82, metalness: 0.04, ...opts,
  });
}

function add(parent, geo, material, x, y, z, opts = {}) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  if (opts.rx) m.rotation.x = opts.rx;
  if (opts.ry) m.rotation.y = opts.ry;
  if (opts.rz) m.rotation.z = opts.rz;
  if (opts.sx || opts.sy || opts.sz) m.scale.set(opts.sx || 1, opts.sy || 1, opts.sz || 1);
  m.castShadow = opts.cast !== false;
  m.receiveShadow = opts.recv !== false;
  parent.add(m);
  return m;
}

function makeLeg(bodyMat, hoofMat, darkMat) {
  const g = new THREE.Group();
  // Shoulder / hip muscle
  add(g, new THREE.SphereGeometry(0.12, 10, 8), bodyMat, 0, -0.02, 0.02, { sx: 1.1, sy: 0.9, sz: 1.15 });
  const upper = add(g, new THREE.CylinderGeometry(0.1, 0.085, 0.46, 10), bodyMat, 0, -0.24, 0);
  // Tendon ridge
  add(g, new THREE.BoxGeometry(0.03, 0.28, 0.04), bodyMat, 0.06, -0.28, 0.02, { cast: false });
  const knee = new THREE.Group();
  knee.position.y = -0.46;
  g.add(knee);
  add(knee, new THREE.SphereGeometry(0.07, 8, 6), bodyMat, 0, 0, 0.01, { sx: 1.1, sy: 0.85, sz: 1.15 });
  add(knee, new THREE.CylinderGeometry(0.072, 0.055, 0.38, 10), bodyMat, 0, -0.2, 0);
  // Cannon bone
  add(knee, new THREE.CylinderGeometry(0.045, 0.042, 0.22, 8), bodyMat, 0, -0.42, 0.01);
  // Fetlock + tuft
  add(knee, new THREE.SphereGeometry(0.055, 8, 6), bodyMat, 0, -0.52, 0.02, { sx: 1.15, sy: 0.7, sz: 1.2 });
  add(knee, new THREE.BoxGeometry(0.08, 0.06, 0.1), darkMat, 0, -0.55, 0.04, { cast: false });
  // Hoof with frog underside cue
  add(knee, new THREE.CylinderGeometry(0.055, 0.062, 0.1, 10), hoofMat, 0, -0.6, 0.03, { rx: 0.1 });
  add(knee, new THREE.BoxGeometry(0.04, 0.02, 0.05), darkMat, 0, -0.66, 0.01, { cast: false });
  g.userData.upper = upper;
  g.userData.knee = knee;
  return g;
}

function makeDenseRider(darkMat, coatMat, denimMat, leatherMat, boneMat) {
  const rider = new THREE.Group();
  rider.name = 'rider';
  const skin = mat(0xc4a882, { roughness: 0.68 });

  // Legs with knee break + boot shaft/spur
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.17, 0.08, 0.02);
    leg.rotation.z = -side * 0.14;
    add(leg, new THREE.BoxGeometry(0.15, 0.28, 0.17), denimMat, 0, 0.05, 0);
    add(leg, new THREE.BoxGeometry(0.14, 0.22, 0.16), denimMat, 0, -0.18, 0.02, { rx: 0.15 });
    add(leg, new THREE.BoxGeometry(0.15, 0.16, 0.26), darkMat, 0, -0.36, 0.06); // boot
    add(leg, new THREE.BoxGeometry(0.12, 0.05, 0.08), darkMat, 0, -0.42, 0.16); // toe
    add(leg, new THREE.BoxGeometry(0.1, 0.03, 0.12), boneMat, 0, -0.28, 0.05, { cast: false }); // shaft strap
    // Spur
    add(leg, new THREE.CylinderGeometry(0.015, 0.015, 0.08, 6), darkMat, side * 0.08, -0.38, 0, { rz: Math.PI / 2 });
    add(leg, new THREE.SphereGeometry(0.025, 6, 4), darkMat, side * 0.12, -0.38, 0);
    rider.add(leg);
  }

  // Torso layers: shirt, vest, duster panels
  add(rider, new THREE.BoxGeometry(0.36, 0.42, 0.24), coatMat, 0, 0.42, -0.02);
  add(rider, new THREE.BoxGeometry(0.4, 0.38, 0.1), mat(0x3a2014, { roughness: 0.9 }), 0, 0.44, 0.1); // vest front
  add(rider, new THREE.BoxGeometry(0.08, 0.36, 0.02), boneMat, 0, 0.44, 0.16, { cast: false }); // buttons strip
  for (const by of [0.32, 0.42, 0.52]) {
    add(rider, new THREE.SphereGeometry(0.02, 6, 4), boneMat, 0, by, 0.17, { cast: false });
  }
  // Duster skirts
  add(rider, new THREE.BoxGeometry(0.22, 0.35, 0.08), coatMat, -0.22, 0.2, -0.04, { rz: 0.2 });
  add(rider, new THREE.BoxGeometry(0.22, 0.35, 0.08), coatMat, 0.22, 0.2, -0.04, { rz: -0.2 });
  // Collar + neckerchief
  add(rider, new THREE.BoxGeometry(0.34, 0.08, 0.22), coatMat, 0, 0.66, -0.02);
  add(rider, new THREE.BoxGeometry(0.16, 0.1, 0.08), mat(0x6a2820, { roughness: 0.85 }), 0, 0.58, 0.12);

  // Shoulders + arms with elbow + cuff
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.28, 0.58, 0);
    add(arm, new THREE.SphereGeometry(0.08, 8, 6), coatMat, 0, 0, 0); // shoulder
    add(arm, new THREE.BoxGeometry(0.11, 0.26, 0.11), coatMat, 0, -0.16, 0.06, { rx: -0.5 });
    add(arm, new THREE.BoxGeometry(0.1, 0.22, 0.1), coatMat, 0, -0.36, 0.14, { rx: -0.35 });
    add(arm, new THREE.BoxGeometry(0.09, 0.08, 0.09), darkMat, 0, -0.48, 0.18); // glove
    // Holster on right hip
    if (side === 1) {
      add(rider, new THREE.BoxGeometry(0.1, 0.22, 0.08), leatherMat, 0.28, 0.28, 0.02);
      add(rider, new THREE.BoxGeometry(0.04, 0.14, 0.04), darkMat, 0.28, 0.22, 0.06, { cast: false });
    }
    rider.add(arm);
  }

  // Belt + buckle
  add(rider, new THREE.BoxGeometry(0.42, 0.06, 0.28), leatherMat, 0, 0.22, -0.02);
  add(rider, new THREE.BoxGeometry(0.08, 0.07, 0.04), boneMat, 0, 0.22, 0.14);

  // Head
  add(rider, new THREE.CylinderGeometry(0.07, 0.085, 0.12, 10), skin, 0, 0.74, -0.02);
  add(rider, new THREE.SphereGeometry(0.13, 12, 10), skin, 0, 0.9, -0.02, { sy: 1.12, sz: 0.95 });
  add(rider, new THREE.BoxGeometry(0.1, 0.04, 0.06), skin, 0, 0.84, 0.1); // nose
  add(rider, new THREE.BoxGeometry(0.12, 0.03, 0.04), darkMat, 0, 0.92, 0.08, { cast: false }); // brows
  const eyeMat = mat(0x0a0806, { roughness: 0.25 });
  add(rider, new THREE.SphereGeometry(0.025, 8, 6), eyeMat, -0.05, 0.92, 0.1);
  add(rider, new THREE.SphereGeometry(0.025, 8, 6), eyeMat, 0.05, 0.92, 0.1);
  // Stubble
  add(rider, new THREE.BoxGeometry(0.12, 0.04, 0.06), mat(0x3a2a20, { roughness: 0.95 }), 0, 0.82, 0.08, { cast: false });

  // Stetson — crown, crease, brim, stampede string
  add(rider, new THREE.CylinderGeometry(0.14, 0.16, 0.18, 14), darkMat, 0, 1.04, -0.02);
  add(rider, new THREE.BoxGeometry(0.04, 0.16, 0.18), darkMat, 0, 1.06, -0.02, { cast: false }); // crease
  add(rider, new THREE.CylinderGeometry(0.3, 0.32, 0.035, 16), darkMat, 0, 0.96, -0.02);
  add(rider, new THREE.BoxGeometry(0.24, 0.03, 0.12), darkMat, 0, 0.96, 0.2); // front pinch
  add(rider, new THREE.TorusGeometry(0.15, 0.012, 6, 16), boneMat, 0, 0.97, -0.02, { rx: Math.PI / 2, cast: false });
  // Bandana tails
  add(rider, new THREE.BoxGeometry(0.06, 0.14, 0.04), mat(0x6a2820), -0.08, 0.5, -0.14, { rx: 0.3 });

  return rider;
}

/**
 * Dense western horse — many purposeful parts (muscles, bridle, saddle tree, rider kit).
 */
export function createDenseHorseMesh(profile) {
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
  const boneMat = mat(0xc8b898, { roughness: 0.65, metalness: 0.15 });
  const whiteMat = mat(0xe8dcc8, { roughness: 0.7 });

  const bodyRoot = new THREE.Group();
  bodyRoot.position.y = 1.15;
  root.add(bodyRoot);

  // Barrel as overlapping muscle masses (NOT a lathe)
  add(bodyRoot, new THREE.SphereGeometry(0.42, 16, 12), bodyMat, 0, 0.02, 0, { sx: 1.05, sy: 0.95, sz: 1.55 });
  add(bodyRoot, new THREE.SphereGeometry(0.36, 14, 12), bodyMat, 0, -0.02, 0.55, { sx: 1.15, sy: 1.0, sz: 1.1 }); // chest
  add(bodyRoot, new THREE.SphereGeometry(0.38, 14, 12), bodyMat, 0, 0.06, -0.55, { sx: 1.2, sy: 1.1, sz: 1.05 }); // haunch
  add(bodyRoot, new THREE.SphereGeometry(0.3, 12, 10), bodyMat, 0, -0.2, 0.05, { sx: 0.95, sy: 0.75, sz: 1.4 }); // belly
  // Withers / spine ridge
  add(bodyRoot, new THREE.BoxGeometry(0.12, 0.1, 0.9), bodyMat, 0, 0.32, 0.05, { cast: false });
  // Shoulder blades
  add(bodyRoot, new THREE.SphereGeometry(0.16, 10, 8), bodyMat, -0.22, 0.2, 0.4, { sx: 0.7, sy: 1, sz: 1.1 });
  add(bodyRoot, new THREE.SphereGeometry(0.16, 10, 8), bodyMat, 0.22, 0.2, 0.4, { sx: 0.7, sy: 1, sz: 1.1 });
  // Hip points
  add(bodyRoot, new THREE.SphereGeometry(0.14, 10, 8), bodyMat, -0.26, 0.22, -0.5, { sx: 0.8, sy: 1, sz: 0.9 });
  add(bodyRoot, new THREE.SphereGeometry(0.14, 10, 8), bodyMat, 0.26, 0.22, -0.5, { sx: 0.8, sy: 1, sz: 0.9 });

  // Neck — multi-segment arch with crest
  const neckGroup = new THREE.Group();
  neckGroup.position.set(0, 0.18, 0.78);
  neckGroup.rotation.x = -0.55;
  bodyRoot.add(neckGroup);
  add(neckGroup, new THREE.CylinderGeometry(0.18, 0.24, 0.38, 14), bodyMat, 0, 0.18, 0);
  add(neckGroup, new THREE.CylinderGeometry(0.14, 0.18, 0.34, 14), bodyMat, 0, 0.5, 0.02, { rx: -0.25 });
  add(neckGroup, new THREE.CylinderGeometry(0.12, 0.14, 0.2, 12), bodyMat, 0, 0.72, 0.06, { rx: -0.15 });
  // Jugular groove cue
  add(neckGroup, new THREE.BoxGeometry(0.04, 0.5, 0.06), bodyMat, 0.1, 0.4, 0.08, { cast: false });

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.86, 0.08);
  headGroup.rotation.x = 0.4;
  neckGroup.add(headGroup);

  // Skull masses
  add(headGroup, new THREE.BoxGeometry(0.26, 0.24, 0.28), bodyMat, 0, 0.02, 0);
  add(headGroup, new THREE.SphereGeometry(0.11, 10, 8), bodyMat, -0.11, -0.02, 0.02, { sx: 0.7, sy: 1.1, sz: 1.15 });
  add(headGroup, new THREE.SphereGeometry(0.11, 10, 8), bodyMat, 0.11, -0.02, 0.02, { sx: 0.7, sy: 1.1, sz: 1.15 });
  add(headGroup, new THREE.BoxGeometry(0.18, 0.16, 0.38), bodyMat, 0, -0.04, 0.28);
  add(headGroup, new THREE.BoxGeometry(0.16, 0.1, 0.14), dark, 0, -0.06, 0.5); // muzzle
  // Star blaze (Dun/Bay accent)
  add(headGroup, new THREE.BoxGeometry(0.06, 0.14, 0.02), whiteMat, 0, 0.06, 0.14, { cast: false });
  add(headGroup, new THREE.SphereGeometry(0.028, 6, 4), dark, -0.045, -0.02, 0.56);
  add(headGroup, new THREE.SphereGeometry(0.028, 6, 4), dark, 0.045, -0.02, 0.56);
  // Jaw
  add(headGroup, new THREE.BoxGeometry(0.14, 0.08, 0.2), bodyMat, 0, -0.12, 0.2);
  // Ears
  for (const side of [-1, 1]) {
    add(headGroup, new THREE.ConeGeometry(0.05, 0.18, 6), bodyMat, side * 0.09, 0.2, -0.04, { rz: -side * 0.2, rx: -0.15 });
    add(headGroup, new THREE.ConeGeometry(0.03, 0.1, 5), dark, side * 0.09, 0.18, -0.02, { rz: -side * 0.2, cast: false });
  }
  const eyeMat = mat(0x0a0806, { roughness: 0.25 });
  add(headGroup, new THREE.SphereGeometry(0.04, 10, 8), eyeMat, -0.13, 0.06, 0.1);
  add(headGroup, new THREE.SphereGeometry(0.04, 10, 8), eyeMat, 0.13, 0.06, 0.1);
  add(headGroup, new THREE.BoxGeometry(0.06, 0.02, 0.04), dark, -0.13, 0.1, 0.1, { cast: false });
  add(headGroup, new THREE.BoxGeometry(0.06, 0.02, 0.04), dark, 0.13, 0.1, 0.1, { cast: false });

  // Bridle + bit + reins
  add(headGroup, new THREE.TorusGeometry(0.14, 0.012, 6, 16), leather, 0, 0.0, 0.05, { rx: Math.PI / 2 });
  add(headGroup, new THREE.TorusGeometry(0.1, 0.01, 5, 12), leather, 0, -0.04, 0.35, { rx: Math.PI / 2 });
  add(headGroup, new THREE.TorusGeometry(0.05, 0.008, 5, 10), dark, 0, -0.08, 0.52, { rx: Math.PI / 2 }); // bit
  for (const side of [-1, 1]) {
    add(headGroup, new THREE.BoxGeometry(0.02, 0.02, 0.5), leather, side * 0.12, -0.02, 0.15, { cast: false });
  }

  // Mane — many strands along crest
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    add(neckGroup, new THREE.BoxGeometry(0.05 + (i % 3) * 0.015, 0.12 + t * 0.16, 0.08), maneMat,
      ((i % 2) - 0.5) * 0.05, 0.2 + t * 0.55, -0.14 - t * 0.02,
      { rx: 0.15 + t * 0.2 });
  }
  add(headGroup, new THREE.BoxGeometry(0.08, 0.18, 0.22), maneMat, 0, 0.14, -0.06);
  add(headGroup, new THREE.BoxGeometry(0.05, 0.16, 0.1), maneMat, 0, 0.06, 0.12, { rx: 0.55 });

  // Tail cascade
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0.2, -0.9);
  bodyRoot.add(tailGroup);
  add(tailGroup, new THREE.SphereGeometry(0.08, 8, 6), maneMat, 0, 0.02, 0); // dock
  add(tailGroup, new THREE.CylinderGeometry(0.07, 0.1, 0.5, 10), maneMat, 0, -0.14, -0.16, { rx: 0.55 });
  add(tailGroup, new THREE.CylinderGeometry(0.05, 0.08, 0.45, 10), maneMat, 0, -0.42, -0.4, { rx: 0.35 });
  add(tailGroup, new THREE.CylinderGeometry(0.03, 0.055, 0.32, 8), maneMat, 0, -0.64, -0.58, { rx: 0.25 });
  for (let i = 0; i < 5; i++) {
    add(tailGroup, new THREE.BoxGeometry(0.04, 0.35, 0.06), maneMat, (i - 2) * 0.03, -0.5, -0.5, { rx: 0.3, cast: false });
  }

  // Western saddle — tree, skirts, stirrups, cinch, blanket
  add(bodyRoot, new THREE.BoxGeometry(0.58, 0.04, 0.55), mat(0x6a2820, { roughness: 0.9 }), 0, 0.32, 0.02); // blanket
  add(bodyRoot, new THREE.BoxGeometry(0.5, 0.14, 0.48), leather, 0, 0.42, 0.02);
  add(bodyRoot, new THREE.BoxGeometry(0.1, 0.28, 0.36), leather, -0.28, 0.22, 0.02);
  add(bodyRoot, new THREE.BoxGeometry(0.1, 0.28, 0.36), leather, 0.28, 0.22, 0.02);
  add(bodyRoot, new THREE.CylinderGeometry(0.045, 0.055, 0.14, 10), leather, 0, 0.56, 0.18); // horn
  add(bodyRoot, new THREE.SphereGeometry(0.05, 8, 6), leather, 0, 0.64, 0.18);
  add(bodyRoot, new THREE.BoxGeometry(0.42, 0.16, 0.12), leather, 0, 0.54, -0.18); // cantle
  add(bodyRoot, new THREE.BoxGeometry(0.48, 0.04, 0.08), leather, 0, 0.28, 0.02); // cinch
  for (const sx of [-0.32, 0.32]) {
    add(bodyRoot, new THREE.BoxGeometry(0.035, 0.38, 0.035), leather, sx, 0.02, 0.08);
    add(bodyRoot, new THREE.TorusGeometry(0.07, 0.015, 6, 12), dark, sx, -0.18, 0.08, { ry: Math.PI / 2 });
  }
  // Saddle strings
  for (const sx of [-0.18, 0.18]) {
    add(bodyRoot, new THREE.CylinderGeometry(0.01, 0.01, 0.2, 5), leather, sx, 0.5, -0.05, { cast: false });
  }

  const legDefs = [
    { name: 'fl', x: -0.22, z: 0.52 },
    { name: 'fr', x: 0.22, z: 0.52 },
    { name: 'bl', x: -0.24, z: -0.52 },
    { name: 'br', x: 0.24, z: -0.52 },
  ];
  const legs = [];
  for (const def of legDefs) {
    const leg = makeLeg(bodyMat, hoofMat, dark);
    leg.name = def.name;
    leg.position.set(def.x, 1.15, def.z);
    root.add(leg);
    legs.push(leg);
  }

  const rider = makeDenseRider(dark, coatMat, denimMat, leather, boneMat);
  rider.position.set(0, 1.58, 0.02);
  root.add(rider);

  return { root, legs, rider, body: bodyRoot, neck: neckGroup, head: headGroup, tail: tailGroup };
}
