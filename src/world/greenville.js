import * as THREE from 'three';

/**
 * Authored Greenville strip — dirt street, saloon block, alley + hitch, creek drop.
 * Coordinates: +Z down the street toward the creek. Origin near hitch.
 */

const COL = {
  dirt: 0x5a3a22,
  dirtDark: 0x3a2414,
  wood: 0x4a2e18,
  woodDark: 0x2a180c,
  adobe: 0x8a6a4a,
  adobeDark: 0x6a4a30,
  roof: 0x3a1a12,
  rust: 0x8a4020,
  bone: 0xc8b898,
  water: 0x2a4a48,
  brush: 0x3a4a28,
  night: 0x0a080c,
};

function box(w, h, d, color, x, y, z, matOpts = {}) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.02, ...matOpts }),
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function building(group, { w, h, d, x, z, color = COL.adobe, roofH = 0.4 }) {
  const base = box(w, h, d, color, x, h / 2, z);
  group.add(base);
  const roof = box(w + 0.3, roofH, d + 0.3, COL.roof, x, h + roofH / 2, z);
  group.add(roof);
  // false-front board
  const front = box(w + 0.15, h * 0.35, 0.12, COL.woodDark, x, h + 0.1, z + d / 2 + 0.05);
  group.add(front);
  // door
  group.add(box(0.7, 1.6, 0.08, COL.woodDark, x, 0.8, z + d / 2 + 0.06));
  // windows
  group.add(box(0.55, 0.55, 0.06, 0x1a1018, x - w * 0.28, 1.5, z + d / 2 + 0.06));
  group.add(box(0.55, 0.55, 0.06, 0x1a1018, x + w * 0.28, 1.5, z + d / 2 + 0.06));
  return base;
}

export function buildGreenville(scene) {
  const root = new THREE.Group();
  root.name = 'greenville';

  // Ground — dirt street + shoulders
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 120),
    new THREE.MeshStandardMaterial({ color: COL.dirt, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  // Street darker strip
  const street = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 90),
    new THREE.MeshStandardMaterial({ color: COL.dirtDark, roughness: 1 }),
  );
  street.rotation.x = -Math.PI / 2;
  street.position.set(0, 0.01, 10);
  street.receiveShadow = true;
  root.add(street);

  // Boardwalks
  for (const side of [-1, 1]) {
    const walk = box(2.2, 0.18, 55, COL.wood, side * 6.2, 0.09, 5);
    root.add(walk);
  }

  // Saloon block (west side, -X)
  building(root, { w: 8, h: 4.2, d: 7, x: -11, z: 8, color: COL.adobe });
  const saloonSign = box(3.5, 0.7, 0.15, COL.rust, -11, 4.6, 11.6);
  root.add(saloonSign);

  // Mercantile
  building(root, { w: 6, h: 3.4, d: 6, x: -10, z: -4, color: COL.adobeDark });

  // Sheriff lean-to / empty office
  building(root, { w: 5, h: 3.2, d: 5, x: -9.5, z: 20, color: 0x6a5038 });

  // East side — hotel / rooms
  building(root, { w: 7, h: 4.5, d: 8, x: 11, z: 6, color: 0x7a5a40 });
  building(root, { w: 5.5, h: 3.3, d: 5.5, x: 10.5, z: -6, color: COL.adobe });

  // Stable shed (near hitch)
  building(root, { w: 5, h: 2.8, d: 4, x: 10, z: -18, color: COL.wood });

  // Alley between saloon and mercantile (west) — case spawn
  const alleyZ = 2.2;
  const alleyX = -7.2;
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

  // Case (pickup) — visual marker
  const caseMesh = box(0.55, 0.28, 0.4, 0x2a1810, alleyX, 0.55, alleyZ + 0.2);
  caseMesh.name = 'case';
  root.add(caseMesh);
  const caseGlow = new THREE.PointLight(0xc42828, 0.55, 6);
  caseGlow.position.copy(caseMesh.position).add(new THREE.Vector3(0, 0.5, 0));
  root.add(caseGlow);

  // Hitch rail near alley mouth / street edge
  const hitch = new THREE.Group();
  hitch.name = 'hitch';
  hitch.position.set(-4.5, 0, -2);
  hitch.add(box(0.12, 1.1, 0.12, COL.woodDark, -1.2, 0.55, 0));
  hitch.add(box(0.12, 1.1, 0.12, COL.woodDark, 1.2, 0.55, 0));
  hitch.add(box(2.6, 0.1, 0.1, COL.wood, 0, 1.0, 0));
  root.add(hitch);

  // Fence posts along street
  for (let z = -25; z < 40; z += 4) {
    for (const x of [-5.2, 5.2]) {
      root.add(box(0.12, 1.0, 0.12, COL.woodDark, x, 0.5, z));
    }
  }

  // Watering trough
  root.add(box(2.2, 0.5, 0.7, COL.wood, 4.5, 0.25, -2));

  // Soft-wash / creek drop at +Z far end
  const creekBed = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 18),
    new THREE.MeshStandardMaterial({ color: 0x3a2a18, roughness: 1 }),
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

  // Brush / rocks near creek
  for (let i = 0; i < 14; i++) {
    const bx = (Math.sin(i * 2.7) * 10);
    const bz = 42 + (i % 5) * 2.2;
    root.add(box(0.6 + (i % 3) * 0.3, 0.4, 0.5, COL.brush, bx, 0.2, bz));
  }

  // Distant buttes (billboard blocks)
  for (const [x, z, s] of [[-35, 30, 12], [38, 55, 16], [-28, 70, 10], [30, -20, 9]]) {
    root.add(box(s, s * 0.6, s * 0.5, 0x4a3020, x, s * 0.25, z));
  }

  // Ambient dust lamps — sparse warm points
  const lamp = (x, z) => {
    const l = new THREE.PointLight(0xa85a2a, 0.35, 18);
    l.position.set(x, 3.2, z);
    root.add(l);
    root.add(box(0.15, 2.8, 0.15, COL.woodDark, x, 1.4, z));
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

  return {
    root,
    caseMesh,
    caseGlow,
    hitch,
    drop,
    points,
    hideCase() {
      caseMesh.visible = false;
      caseGlow.visible = false;
    },
    showCase() {
      caseMesh.visible = true;
      caseGlow.visible = true;
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
