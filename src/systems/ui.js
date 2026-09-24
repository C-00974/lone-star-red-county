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
  const compass = $('hud-compass');
  const compassArrow = $('compass-arrow');
  const compassLabel = $('compass-label');
  const playControls = $('hud-controls');
  const playControlsBody = $('hud-controls-body');
  const rideTip = $('hud-ride-tip');

  function showScreen(name) {
    for (const [k, el] of Object.entries(screens)) {
      el.classList.toggle('active', k === name);
    }
    hud.classList.toggle('hidden', name !== null && name !== undefined ? true : false);
    if (compass) compass.classList.add('hidden');
    if (playControls) playControls.classList.add('hidden');
    if (rideTip) rideTip.classList.add('hidden');
  }

  function playMode() {
    for (const el of Object.values(screens)) el.classList.remove('active');
    hud.classList.remove('hidden');
    if (compass) compass.classList.remove('hidden');
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

  /** deg: relative bearing degrees (0 = ahead). label e.g. "CASE 18m". */
  function setCompass(deg, label) {
    if (!compass) return;
    if (label == null) {
      compass.classList.add('hidden');
      return;
    }
    compass.classList.remove('hidden');
    if (compassArrow) compassArrow.style.transform = `rotate(${deg}deg)`;
    if (compassLabel) compassLabel.textContent = label;
  }

  function setCine(speaker, line) {
    cineSpeaker.textContent = speaker;
    cineLine.textContent = line;
  }

  function showEnd({ clean, title, body, kicker }) {
    showScreen('end');
    hud.classList.add('hidden');
    if (compass) compass.classList.add('hidden');
    if (playControls) playControls.classList.add('hidden');
    if (rideTip) rideTip.classList.add('hidden');
    $('end-kicker').textContent = kicker || 'Soft Open';
    const t = $('end-title');
    t.textContent = title;
    t.className = clean ? 'clean' : 'botched';
    $('end-body').textContent = body;
  }


  /** In-play controls legend — always visible during heist. touch=true swaps copy. */
  function showPlayControls(touch) {
    if (!playControls) return;
    playControls.classList.remove('hidden');
    if (playControlsBody) {
      playControlsBody.innerHTML = touch
        ? '<div><b>Stick</b> move</div><div><b>Gallop</b> · <b>Mount</b> · <b>Act</b></div>'
        : '<div><b>W/S</b> Move · <b>A/D</b> Steer</div><div><b>Shift</b> Gallop · <b>E</b> Mount · <b>Space</b> Act</div>';
    }
    if (rideTip) {
      rideTip.classList.remove('hidden', 'fade');
      // restart fade timer
      void rideTip.offsetWidth;
      rideTip.classList.add('show');
      clearTimeout(rideTip._fadeTimer);
      rideTip._fadeTimer = setTimeout(() => {
        rideTip.classList.add('fade');
        setTimeout(() => rideTip.classList.add('hidden'), 700);
      }, 6000);
    }
  }

  function hidePlayControls() {
    if (playControls) playControls.classList.add('hidden');
    if (rideTip) {
      rideTip.classList.add('hidden');
      rideTip.classList.remove('show', 'fade');
      clearTimeout(rideTip._fadeTimer);
    }
  }

  return {
    $, showScreen, playMode, setPrompt, setObjective, setMeters, setTimer, setCompass, setCine, showEnd,
    showPlayControls, hidePlayControls, screens, hud,
  };
}
