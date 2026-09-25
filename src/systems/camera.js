import * as THREE from 'three';

/** Third-person follow cam — framed for Quaternius GLB hero horse (~2m). */
export function createFollowCamera(camera) {
  // Closer frame so the GLB fills the view (was ~7.4m back → mount read as a speck)
  const offset = new THREE.Vector3(0, 2.55, -4.6);
  // Look at withers / rider torso
  const look = new THREE.Vector3(0, 1.45, 0.35);
  const cur = new THREE.Vector3();
  const target = new THREE.Vector3();
  const lookAt = new THREE.Vector3();
  const worldOff = new THREE.Vector3();
  const worldLook = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);

  function update(dt, horseRoot, yaw) {
    quat.setFromAxisAngle(up, yaw);
    worldOff.copy(offset).applyQuaternion(quat);
    worldLook.copy(look).applyQuaternion(quat);
    target.copy(horseRoot.position).add(worldOff);
    lookAt.copy(horseRoot.position).add(worldLook);
    cur.lerp(target, 1 - Math.exp(-5.8 * dt));
    camera.position.copy(cur);
    camera.lookAt(lookAt);
  }

  function snap(horseRoot, yaw) {
    quat.setFromAxisAngle(up, yaw);
    worldOff.copy(offset).applyQuaternion(quat);
    cur.copy(horseRoot.position).add(worldOff);
    camera.position.copy(cur);
    lookAt.copy(horseRoot.position).add(look.clone().applyQuaternion(quat));
    camera.lookAt(lookAt);
  }

  return { update, snap };
}
