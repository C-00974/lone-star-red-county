# RED COUNTY — Soft Open Quiet · ship outcome

**Public URL:** https://c-00974.github.io/lone-star-red-county/

**Phone:** https://c-00974.github.io/lone-star-red-county/?touch=1

**Repo:** https://github.com/C-00974/lone-star-red-county

**Tip SHA:** `01b921f` · graphics parity swing vs GH render class · CT America/Chicago Sep 24, 2026

## What works (Quiet path)

1. **Title** — RED COUNTY / Soft Open; Start Soft Open; Controls + Settings. Zero Golden Hour chapters.
2. **Cold open** — Rae dialogue → Choose horse.
3. **Prep** — Dun (steady) or Bay (sharp / burst). Quiet approach locked.
4. **World** — Soft Open density pass on the tiny strip: real boardwalk planks, window interiors, porch rails, hitch rings/feed/rope coil, alley lantern/sack/wagon wheel/tools, false-front dentils, LIVERY block, creek foam + worn decals.
5. **Horse** — Dense procedural mount (GH-class part count): muscle masses (no lathe barrel), multi-segment neck/head, bridle/bit, layered mane/tail, western saddle tree, denser rider (vest, duster, holster, spurs, Stetson). Dun/Bay retint. Mount/dismount + gait kept.
6. **Quiet loop** — Window + compass + case/drop beacons + heat; alley grab → creek drop; Clean / Botched / Window Closed.
7. **Touch** — `?touch=1` or Settings; in-play legend.

## Graphics parity swing (Sep 24, 2026 CT)

Chris: Soft Open is ~1% of the map *on purpose* for fidelity — close the gap for real vs Golden Hour render class. We greenfielded and spent budget on loop speed; this tip spends it on **render craft**.

### Ported craft (from LoneStar-Next `src/render/`, rewritten for western dusk)
- `src/render/sky.js` — procedural sky dome (sun disc, Mie, cumulus, cirrus, Venus belt). Reskinned: rust/amber sun, cool opposite fill, muted storm/city glow. Soft Open locks phase ≈ 0.55 (late western afternoon → early dusk). FogExp2 far/subtle + directional height-aware fog chunks.
- `src/render/sky-pmrem.js` — reusable PMREM for sky-only env map (r170).
- `src/render/lighting.js` — strong sun + hemi + cool fill + **playAmb floor** (Chris: always be able to see). Shadow map 4096, texel-snapped follow frustum on the tiny strip.
- `src/render/bloom.js` + `postprocessing.js` — TextureBloomPass + OutputPass composite (Next pattern) + ACES.
- `src/render/renderer.js` — WebGLRenderer + post chain wiring.

LoneStar-Next was **not modified** (read-only reference).

### Authored for Red County
- Western dusk palettes (black/blood/rust/bone — no GH gold film look)
- Dense procedural horse + rider (`horseMesh.js`) — no third-party GLB (CC0 GLB download needed Drive/Poly Pizza login; fallback used)
- World density pass on Greenville strip

### Horse asset + license
- **Procedural** Three.js meshes only (vendored into bundle via esbuild)
- No Kenney / Quaternius / Poly Haven GLB in this tip
- License: original authored geometry; textures are runtime canvas procedurals

### Honest remaining gap vs Golden Hour
- GH vehicles are lofted authored surfaces (`evoraModel.js` station/section craft) — horse is dense parts, not a scanned/GLTF hero mesh
- GH sky has richer storm-wall / downtown light-dome storytelling; RC sky is the same *class* of shader with a quieter western lock
- No light pooling needed yet (strip is tiny); GH downtown needs it
- Soft Open still intentionally ~1% map — fidelity spend, not open world

### Public tip
- One-tap: `docs/index.html` (no runtime CDN). Vendor assets into repo/docs only.

## Build

```
cd ~/LoneStar-RedCounty && npm run build
```

Pages serves `docs/` from `main`. Curl public URL should return **200**.
