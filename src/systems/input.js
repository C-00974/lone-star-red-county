/** Keyboard + optional on-screen stick / buttons. */

export function createInput({ touchRoot, stickEl, knobEl, gallopBtn, mountBtn, actBtn }) {
  const keys = Object.create(null);
  const stick = { x: 0, y: 0, active: false };
  let gallop = false;
  let mountPulse = false;
  let actPulse = false;
  let pointerId = null;

  const down = (e) => { keys[e.code] = true; if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); };
  const up = (e) => { keys[e.code] = false; };

  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);

  function setStickFromEvent(clientX, clientY) {
    const r = stickEl.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = (clientX - cx) / (r.width / 2);
    let dy = (clientY - cy) / (r.height / 2);
    const len = Math.hypot(dx, dy) || 1;
    if (len > 1) { dx /= len; dy /= len; }
    stick.x = dx;
    stick.y = dy;
    stick.active = true;
    knobEl.style.transform = `translate(${dx * (r.width * 0.32)}px, ${dy * (r.height * 0.32)}px)`;
  }
  function resetStick() {
    stick.x = 0; stick.y = 0; stick.active = false; pointerId = null;
    knobEl.style.transform = 'translate(0,0)';
  }

  stickEl.addEventListener('pointerdown', (e) => {
    pointerId = e.pointerId;
    stickEl.setPointerCapture(e.pointerId);
    setStickFromEvent(e.clientX, e.clientY);
  });
  stickEl.addEventListener('pointermove', (e) => {
    if (pointerId !== e.pointerId) return;
    setStickFromEvent(e.clientX, e.clientY);
  });
  stickEl.addEventListener('pointerup', resetStick);
  stickEl.addEventListener('pointercancel', resetStick);

  const hold = (btn, on, off) => {
    const start = (e) => { e.preventDefault(); btn.classList.add('held'); on(); };
    const end = () => { btn.classList.remove('held'); off(); };
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointerleave', end);
    btn.addEventListener('pointercancel', end);
  };
  hold(gallopBtn, () => { gallop = true; }, () => { gallop = false; });
  mountBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); mountPulse = true; });
  actBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); actPulse = true; });

  function setTouchVisible(v) {
    touchRoot.classList.toggle('hidden', !v);
  }

  function sample() {
    const forward = (keys.KeyW || keys.ArrowUp ? 1 : 0) + (keys.KeyS || keys.ArrowDown ? -1 : 0) + (-stick.y);
    const steer = (keys.KeyD || keys.ArrowRight ? 1 : 0) + (keys.KeyA || keys.ArrowLeft ? -1 : 0) + stick.x;
    const sprint = !!(keys.ShiftLeft || keys.ShiftRight || gallop);
    const mount = !!(keys.KeyE) || mountPulse;
    const act = !!(keys.Space) || actPulse;
    mountPulse = false;
    actPulse = false;
    return {
      forward: Math.max(-1, Math.min(1, forward)),
      steer: Math.max(-1, Math.min(1, steer)),
      sprint,
      mount,
      act,
    };
  }

  return { sample, setTouchVisible, keys };
}
