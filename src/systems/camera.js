import * as THREE from 'three';

/** Third-person follow cam — slightly low and dusty western feel. */
export function createFollowCamera(camera) {
  const offset = new THREE.Vector3(0, 3.2, -7.5);
  const look = new THREE.Vector3(0, 1.4, 2.2);
  const cur = new THREE.Vector3();
  const target = new THREE.Vector3();
  const lookAt = new THREE.Vector3();
  const worldOff = new THREE.Vector3();
  const worldLook = new THREE.Vector3();
  const quat = new THREE.Quaternion();

  function update(dt, horseRoot, yaw) {
    quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    worldOff.copy(offset).applyQuaternion(quat);
    worldLook.copy(look).applyQuaternion(quat);
    target.copy(horseRoot.position).add(worldOff);
    lookAt.copy(horseRoot.position).add(worldLook);
    cur.lerp(target, 1 - Math.exp(-4.5 * dt));
    camera.position.copy(cur);
    camera.lookAt(lookAt);
  }

  function snap(horseRoot, yaw) {
    quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    worldOff.copy(offset).applyQuaternion(quat);
    cur.copy(horseRoot.position).add(worldOff);
    camera.position.copy(cur);
    lookAt.copy(horseRoot.position).add(look.clone().applyQuaternion(quat));
    camera.lookAt(lookAt);
  }

  return { update, snap };
}
