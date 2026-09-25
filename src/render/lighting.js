// Sun + sky lighting, shadow frustum that follows the rider, fog, environment map, western dusk.
// Per-phase colours/intensities come from the sky palette (sky.setPhase) so fog, hemi, fill and PMREM stay consistent with the dome.
import * as THREE from 'three';
import { qualityPreset } from './quality.js';
import { ReusableSkyPMREMGenerator } from './sky-pmrem.js';

export function casterSphere(mesh, target = new THREE.Sphere()) {
  if (!mesh.isMesh || mesh.isInstancedMesh || mesh.isBatchedMesh || mesh.isSkinnedMesh) return null;
  if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
  mesh.updateWorldMatrix(true, false);
  return target.copy(mesh.geometry.boundingSphere).applyMatrix4(mesh.matrixWorld);
}

export function syncSunShadow(sun, refresh = false) {
  const enabled = sun.intensity > 0, wasEnabled = sun.shadow.autoUpdate;
  sun.shadow.autoUpdate = enabled;
  if (!enabled) sun.shadow.needsUpdate = false;
  else if (!wasEnabled || refresh) sun.shadow.needsUpdate = true;
}

export function createLighting(scene, renderer, sky) {
  const q = qualityPreset();
  const sun = new THREE.DirectionalLight(0xffffff, 4.0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(q.shadow, q.shadow);
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 200;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.35; sun.shadow.radius = 2;
  const target = new THREE.Object3D(); scene.add(target); sun.target = target; scene.add(sun);
  const hemi = new THREE.HemisphereLight(0xc4a080, 0x5a3828, 0.45); scene.add(hemi);
  // Soft playability floor so dusk never goes pitch-black (Chris: always be able to see).
  const playAmb = new THREE.AmbientLight(0xb8a090, 0.0); scene.add(playAmb);
  // Cool fill from the east — opposite the rust/amber western sun
  const fill = new THREE.DirectionalLight(0x8a90b0, 0.36); fill.position.set(40, 28, -20); scene.add(fill);
  scene.fog = new THREE.FogExp2(0xb88868, 0.0045);
  const pmrem = new ReusableSkyPMREMGenerator(renderer); pmrem.compileEquirectangularShader();
  const envScene = new THREE.Scene(); envScene.add(sky.mesh.clone());
  let envTarget = null, envPhase = -1;
  function updateEnv(force) {
    if (!force && Math.abs(sky.phase - envPhase) < 0.08) return;
    envPhase = sky.phase;
    envScene.children[0].material = sky.mesh.material;
    // Dome ~720 m: cube camera far must reach it (fromScene defaults to far=100)
    const rt = pmrem.fromScene(envScene, 0.04, 1, 2000);
    const oldTarget = envTarget;
    envTarget = rt; scene.environment = rt.texture; scene.environmentIntensity = api.envI;
    api.envRevision++;
    if (oldTarget && oldTarget !== rt) oldTarget.dispose();
  }
  const casters = []; let castersScanned = false;
  const api = {
    sun, hemi, fill, playAmb, target, phase: 0, envRevision: 0, envI: 0.7,
    cullCasters(px, pz) {
      const sphere = new THREE.Sphere();
      if (!castersScanned) {
        castersScanned = true;
        scene.traverse((o) => {
          if (o.isMesh && o.castShadow) {
            const bounds = casterSphere(o, sphere);
            if (bounds && bounds.radius < 80) casters.push(o);
          }
        });
      }
      const R = 55;
      for (const o of casters) {
        const s = casterSphere(o, sphere);
        if (!s) continue;
        o.castShadow = Math.hypot(s.center.x - px, s.center.z - pz) - s.radius < R;
      }
    },
    setQuality() {
      const qq = qualityPreset();
      sun.shadow.mapSize.set(qq.shadow, qq.shadow);
      if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
      syncSunShadow(sun, true);
    },
    follow(px, py, pz, fx, fz) {
      const qq = qualityPreset(); const R = qq.shadowRadius;
      const cam = sun.shadow.camera;
      cam.left = -R; cam.right = R; cam.top = R; cam.bottom = -R;
      cam.updateProjectionMatrix();
      const cx = px + fx * R * 0.35, cz = pz + fz * R * 0.35;
      const texel = (2 * R) / qq.shadow;
      const sx = Math.round(cx / texel) * texel, sz = Math.round(cz / texel) * texel;
      target.position.set(sx, py, sz);
      sun.position.set(
        sx + sky.sunDir.x * 80,
        py + Math.max(0.12, sky.sunDir.y) * 80,
        sz + sky.sunDir.z * 80,
      );
      sun.updateMatrixWorld(); target.updateMatrixWorld();
    },
    setPhase(phase) {
      api.phase = phase; const s = sky.setPhase(phase);
      sun.color.setRGB(...s.sun); sun.intensity = s.sunI;
      syncSunShadow(sun);
      hemi.color.setRGB(...s.hemiSky); hemi.groundColor.setRGB(...s.hemiGround); hemi.intensity = s.hemiI;
      fill.color.setRGB(...s.fill); fill.intensity = s.fillI;
      // Ambient floor ramps with night so riding stays readable without killing day contrast.
      playAmb.intensity = Math.max(0, (s.night - 0.15) / 0.85) * 0.65;
      // Soft Open always has a minimum floor so dusk never caves out the mount
      if (playAmb.intensity < 0.28) playAmb.intensity = 0.28 + s.night * 0.14;
      scene.fog.color.setRGB(...s.fog); scene.fog.density = s.fogDensity;
      api.envI = s.envI; scene.environmentIntensity = s.envI;
      updateEnv(false);
      return s;
    },
    updateEnv,
    dispose() {
      if (scene.environment === envTarget?.texture) scene.environment = null;
      envTarget?.dispose(); envTarget = null; pmrem.dispose();
    },
  };
  api.setPhase(0.55); // Soft Open lock: late western afternoon → early dusk
  return api;
}
