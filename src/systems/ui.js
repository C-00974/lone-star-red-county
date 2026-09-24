export function createUI() {
  const $ = (id) => document.getElementById(id);
  const screens = {
    title: $('screen-title'),
    cinematic: $('screen-cinematic'),
    prep: $('screen-prep'),
    end: $('screen-end'),
  };
  const hud = $('hud');
  const prompt = $('hud-prompt');
  const obj = $('hud-obj');
  const timer = $('hud-timer');
  const stam = $('bar-stam');
  const heat = $('bar-heat');
  const cineSpeaker = $('cine-speaker');
  const cineLine = $('cine-line');

  function showScreen(name) {
    for (const [k, el] of Object.entries(screens)) {
      el.classList.toggle('active', k === name);
    }
    hud.classList.toggle('hidden', name !== null && name !== undefined ? true : false);
  }

  function playMode() {
    for (const el of Object.values(screens)) el.classList.remove('active');
    hud.classList.remove('hidden');
  }

  function setPrompt(text) {
    if (!text) { prompt.classList.remove('show'); prompt.textContent = ''; return; }
    prompt.textContent = text;
    prompt.classList.add('show');
  }

  function setObjective(text) { obj.textContent = text; }

  function setMeters(staminaRatio, heatRatio) {
    stam.style.transform = `scaleX(${Math.max(0, Math.min(1, staminaRatio))})`;
    heat.style.transform = `scaleX(${Math.max(0, Math.min(1, heatRatio))})`;
  }

  function setTimer(sec) {
    if (sec == null || sec < 0) { timer.textContent = '—'; return; }
    const s = Math.max(0, Math.ceil(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    timer.textContent = `${m}:${r.toString().padStart(2, '0')}`;
    timer.style.color = s <= 20 ? '#c42828' : '';
  }

  function setCine(speaker, line) {
    cineSpeaker.textContent = speaker;
    cineLine.textContent = line;
  }

  function showEnd({ clean, title, body, kicker }) {
    showScreen('end');
    hud.classList.add('hidden');
    $('end-kicker').textContent = kicker || 'Soft Open';
    const t = $('end-title');
    t.textContent = title;
    t.className = clean ? 'clean' : 'botched';
    $('end-body').textContent = body;
  }

  return {
    $, showScreen, playMode, setPrompt, setObjective, setMeters, setTimer, setCine, showEnd, screens, hud,
  };
}
