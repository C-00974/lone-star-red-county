/** Soft Open Quiet — Rae brief + in-mission prompts. */

export const COLD_OPEN = [
  { speaker: 'RAE', line: "Greenville's quiet tonight. That's the lie they sell." },
  { speaker: 'RAE', line: "Case is in the alley behind the saloon. Soft wash at the creek. No guns if we can help it." },
  { speaker: 'RAE', line: "You pick the horse. Quiet approach. Window's tight — don't make heat on the street." },
  { speaker: 'RAE', line: "Ride clean, we eat. Botch it… we don't talk about that." },
];

export const END_CLEAN = {
  clean: true,
  title: 'Clean',
  kicker: 'Soft Open · Quiet',
  body: 'Case hits the wash. Rae doesn’t smile — she never does — but the heat dies in the dust. Greenville looks the other way.',
};

export const END_BOTCHED = {
  clean: false,
  title: 'Botched',
  kicker: 'Soft Open · Quiet',
  body: 'Heat cooked the strip. Whistles, boots, bad luck. The case is gone or worse — and Rae already knows.',
};

export const END_TIMEOUT = {
  clean: false,
  title: 'Window Closed',
  kicker: 'Soft Open · Quiet',
  body: 'Time burned out. The alley’s empty and the wash is watched. Try again before Greenville wakes up.',
};
