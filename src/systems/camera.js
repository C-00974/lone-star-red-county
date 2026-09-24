import * as THREE from 'three';

/** Third-person follow cam — tighter + higher so horse silhouette reads in frame. */
export function createFollowCamera(camera) {
  const offset = new THREE.Vector3(0, 4.1, -6.2);
  const look = new THREE.Vector3(0, 1.55, 2.0);
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
    // Slightly snappier follow so horse stays framed
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
