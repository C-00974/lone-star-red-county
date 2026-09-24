/** Simple heat meter — rises near street while carrying case or galloping in town. */
export function createHeat() {
  let heat = 0;
  const max = 100;

  function update(dt, { carrying, inStreet, galloping, nearDrop }) {
    let d = -6 * dt; // natural cool
    if (carrying && inStreet) d += 14 * dt;
    if (carrying && galloping && inStreet) d += 10 * dt;
    if (carrying && nearDrop) d -= 8 * dt;
    if (!carrying && inStreet && galloping) d += 3 * dt;
    heat = Math.max(0, Math.min(max, heat + d));
  }

  function reset() { heat = 0; }
  function get() { return heat; }
  function ratio() { return heat / max; }
  function isBotched() { return heat >= max; }

  return { update, reset, get, ratio, isBotched, max };
}
