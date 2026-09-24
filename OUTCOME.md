# RED COUNTY — Soft Open Quiet · ship outcome

**Public URL:** https://c-00974.github.io/lone-star-red-county/

**Phone:** https://c-00974.github.io/lone-star-red-county/?touch=1

**Repo:** https://github.com/C-00974/lone-star-red-county

**Tip SHA:** `d5b6d94` (fidelity pass · CT America/Chicago Sep 24, 2026)

## What works (Quiet path)

1. **Title** — RED COUNTY / Soft Open; Start Soft Open; Controls + Settings panels. Zero Golden Hour chapters.
2. **Cold open** — Rae dialogue panels (4 beats) → Choose horse.
3. **Prep** — Dun (steady / stamina) or Bay (sharp / burst). Quiet approach locked.
4. **World** — Authored Greenville strip with procedural textures: grit dirt, wood boardwalks, adobe grain, saloon/hotel canvas signs, porch posts, hitch rope, alley crates, creek water opacity, dusk sky.
5. **Horse** — Second craft pass: denser lathe barrel, layered mane, leather saddle map, coat noise, jointed legs + gait; Dun/Bay variants. Procedural (no external GLB).
6. **Quiet loop** — Window timer (~150s) + compass + case/drop beacons + heat meter; alley case grab → ride to creek drop; Clean / Botched / Window Closed end cards → Ride again or Title.
7. **Touch** — `?touch=1` or Settings: stick + Gallop/Mount/Act with short labels; in-play legend swaps to stick / Gallop / Mount / Act.
8. **In-play controls** — Desktop legend always visible during heist (W/S · A/D · Shift · E · Space); first-ride tip fades ~6s; legend stays. Does not cover compass.

## Fidelity pass (Sep 24, 2026 CT)

Chris on tip `8a984de`: "great first legit" start — but no control info while playing, lighting ridiculous, graphics need ~20×. Soft Open stays a *small* strip so we can push fidelity. Story/Quiet loop kept.

### A) In-play controls
- Semi-transparent bone/rust HUD panel, bottom-left, during `play`
- Desktop: Move W/S · Steer A/D · Gallop Shift · Mount E · Act Space
- Touch: legend + under-button labels (Stick / Gallop / Mount / Act)
- Optional tip banner fades after ~6s; legend remains

### B) Lighting rewrite
- Equirect sky gradient (violet zenith → amber haze → rust horizon) — not near-black cave
- Strong warm key sun, low western angle (rust/amber)
- Soft east fill + ambient so shadows don't crush detail
- Fog only for far depth (`near≈52`, `far≈145`); near field clear
- Building windows / street lamps as secondary fill
- Exposure ~1.48; soft contact shadows (PCF soft, higher map)
- Subtle UnrealBloom (high threshold) on lamps/windows/beacons

### C) Graphics fidelity
- Procedural canvas textures: dirt grit, street bed, wood planks, adobe grain, leather, coat noise, water, crate wood, painted signs
- Horse denser segments + leather saddle + layered mane/tail
- World: false-front depth, porch posts, hitch rope, SALOON/HOTEL lettering, alley crates, creek water
- Horse casts; ground receives

### Asset licenses
- All textures procedural (runtime canvas) — no third-party assets
- No vendored GLB (pure Three.js mesh craft) — no CDN

### Known limits
- Soft Open strip only (intentionally small)
- Bloom is global-threshold (cheap), not selective mesh bloom
- Horse is hand-authored low-poly, not a scanned GLTF mount
- Parent should browser-check — do **not** claim Chris-approved beauty
- Decoy / Loud, audio, NPC traffic still stubs

## Distinct from Golden Hour

- New repo + path (`LoneStar-RedCounty`), not a reskin of LoneStar-Next
- No scout camera, scrapbook, film-crew chrome, or gold theme
- Heist-forward horse loop only

## Build

```
cd ~/LoneStar-RedCounty && npm run build
```

Pages serves `docs/` from `main`. Curl public URL should return **200**.
