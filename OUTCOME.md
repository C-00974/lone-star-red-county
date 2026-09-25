# RED COUNTY — Soft Open Quiet · ship outcome

**Public URL:** https://c-00974.github.io/lone-star-red-county/

**Phone:** https://c-00974.github.io/lone-star-red-county/?touch=1

**Repo:** https://github.com/C-00974/lone-star-red-county

**Tip SHA:** `TIP_PLACEHOLDER` · hero GLB horse (Quaternius CC0), no procedural mount · CT America/Chicago Sep 24, 2026

## What works (Quiet path)

1. **Title** — RED COUNTY / Soft Open; Start Soft Open; Controls + Settings. Zero Golden Hour chapters.
2. **Cold open** — Rae dialogue → Choose horse.
3. **Prep** — Dun (steady) or Bay (sharp / burst). Quiet approach locked.
4. **World** — Soft Open density pass on the tiny strip + **Quaternius Fantasy Stable** GLB landmark by LIVERY (roof retinted rust — not teal medieval).
5. **Horse** — **hero GLB horse (Quaternius CC0), no procedural mount.** `GLTFLoader` + `SkeletonUtils.clone` from `./assets/models/horse.glb`. Dun/Bay = cloned material retints (Main / Main_Dark / Main_Light / Hair). AnimationMixer clips: Idle, Walk, Gallop (trot = Walk @ 1.55×). Mount/dismount + stamina/gait controller kept. Compact rider kit for mounted visibility only.
6. **Quiet loop** — Window + compass + case/drop beacons + heat; alley grab → creek drop; Clean / Botched / Window Closed.
7. **Touch** — `?touch=1` or Settings; in-play legend.

## Graphics / assets (this tip)

### Hero horse
- Source: Quaternius via Poly Pizza — https://poly.pizza/m/qvTrSG9pZF (CC0)
- Files: `assets/models/horse.glb` (+ `horse-alt.glb` fallback unused), published under `docs/assets/models/` for Pages
- Load path (runtime): `./assets/models/horse.glb`
- Clips present: Idle, Idle_2, Walk, Gallop, Eating, Jump variants, Attack_*, Death (Soft Open uses Idle / Walk / Gallop)
- Honest look: Quaternius is still **stylized low-poly** — not a scanned hero — but it is a **real authored GLB** vs boxes / procedural densify. Reads as the mount, not a toy mesh tip.

### Stable landmark
- Source: Quaternius Fantasy Stable (CC0) — `assets/models/stable.glb`
- Placed west of hitch / by LIVERY; roof tiles retinted to rust western; stone slightly warmed
- Y = placed

### License
- `assets/licenses/ATTRIBUTION.md` (also `docs/assets/licenses/ATTRIBUTION.md`)

### Render craft (prior tip, still shipping)
- Western dusk sky / PMREM / lighting / bloom stack from Next craft (LoneStar-Next **not** modified)

### Removed
- `src/systems/horseMesh.js` procedural densify mount — deleted
- Soft Open no longer depends on `createDenseHorseMesh`

## Build

```
cd ~/LoneStar-RedCounty && npm run build
```

Pages serves `docs/` from `main`. Curl public URL should return **200**; `assets/models/horse.glb` should 200 from Pages.
