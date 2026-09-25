# RED COUNTY — Soft Open Quiet · ship outcome

**Public URL:** https://c-00974.github.io/lone-star-red-county/

**Phone:** https://c-00974.github.io/lone-star-red-county/?touch=1

**Repo:** https://github.com/C-00974/lone-star-red-county

**Tip SHA:** `e27c0bc` · GLB horse scale/visibility fix · CT America/Chicago Sep 24, 2026

## What works (Quiet path)

1. **Title** — RED COUNTY / Soft Open; Start Soft Open; Controls + Settings. Zero Golden Hour chapters.
2. **Cold open** — Rae dialogue → Choose horse.
3. **Prep** — Dun (steady) or Bay (sharp / burst). Quiet approach locked.
4. **World** — Soft Open density pass on the tiny strip + **Quaternius Fantasy Stable** GLB landmark by LIVERY (roof retinted rust — not teal medieval).
5. **Horse** — **hero GLB horse (Quaternius CC0)** with **calibrated scale + dusk-readable coats**. Fixed `CALIBRATED_SCALE = 0.424963` (no skinned `Box3.setFromObject`). Dun sand vs Bay chestnut retints; metalness forced to 0.04. AnimationMixer Idle/Walk/Gallop (`mixer.update(dt)` each frame). Closer follow cam (~4.6m back, look at withers).
6. **Quiet loop** — Window + compass + case/drop beacons + heat; alley grab → creek drop; Clean / Botched / Window Closed.
7. **Touch** — `?touch=1` or Settings; in-play legend.

## Graphics / assets (this tip)

### GLB horse scale/visibility fix
- **Cause:** Runtime `Box3().setFromObject(skinned)` is unreliable on Quaternius bind-pose; + metalness ~0.4 crushed coats at Soft Open dusk; cam sat ~7.4m back so mount read as a tan speck under the rider hat.
- **Calibrated scale:** `CALIBRATED_SCALE = 0.424963`  
  Measured mesh vertex extents (Node / three@0.170, after armature `scale=100`): **H=4.8239 · W=1.4069 · L=5.6761**  
  Target height 2.05 → scale `2.05 / 4.8239`.  
  **After scale:** W≈0.60m · **H=2.05m** · L≈2.41m · feet grounded at Y=0 (vs hitch post 1.3m).
- **Orientation:** Head faces **+Z** (matches controller yaw=0).
- **Coats:** Dun `#d4b078` / Bay `#c46838` (distinct); roughness ≥0.72; metalness 0.04.
- **Lighting:** playAmb Soft Open floor ≥0.28; fill 0.36; exposure 1.38.
- **Camera:** offset `(0, 2.55, -4.6)`, look `(0, 1.45, 0.35)` (withers).

### Hero horse source
- Quaternius via Poly Pizza — https://poly.pizza/m/qvTrSG9pZF (CC0)
- Files: `assets/models/horse.glb` published under `docs/assets/models/`
- Load path: `./assets/models/horse.glb`
- Clips: Idle / Walk / Gallop (trot = Walk @ 1.55×)

### Stable landmark
- Quaternius Fantasy Stable (CC0) — `assets/models/stable.glb`
- West of hitch / by LIVERY; roof retinted rust western

### License
- `assets/licenses/ATTRIBUTION.md` (also `docs/assets/licenses/ATTRIBUTION.md`)

### Removed (prior)
- Procedural densify mount — not restored. LoneStar-Next untouched.

## Build

```
cd ~/LoneStar-RedCounty && npm run build
```

Pages serves `docs/` from `main`. Curl public URL + `assets/models/horse.glb` should return **200**.
