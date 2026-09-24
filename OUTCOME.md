# RED COUNTY — Soft Open Quiet · ship outcome

**Public URL:** https://c-00974.github.io/lone-star-red-county/

**Phone:** https://c-00974.github.io/lone-star-red-county/?touch=1

**Repo:** https://github.com/C-00974/lone-star-red-county

**Tip SHA:**  (craft standards pass · CT America/Chicago Sep 24, 2026)

## What works (Quiet path)

1. **Title** — RED COUNTY / Soft Open; Start Soft Open; Controls + Settings panels. Zero Golden Hour chapters.
2. **Cold open** — Rae dialogue panels (4 beats) → Choose horse.
3. **Prep** — Dun (steady / stamina) or Bay (sharp / burst). Quiet approach locked.
4. **World** — Authored Greenville strip: dirt street, saloon / mercantile / hotel blocks, alley crates + case, hitch rail, creek soft-wash drop, buttes, dusk lighting (black/blood/rust/bone).
5. **Horse** — Hand-authored low-poly western horse (Lathe body, neck arch, snout, mane/tail, jointed legs); third-person walk/trot/gallop, steer, stamina, mount/dismount near hitch.
6. **Quiet loop** — Window timer (~150s) + compass + case/drop beacons + heat meter; alley case grab → ride to creek drop; Clean / Botched / Window Closed end cards → Ride again or Title.
7. **Touch** —  or Settings: on-screen stick, Gallop, Mount, Act.

## Stubs / later

- Decoy / Loud approaches (UI says coming later)
- Richer cutscenes / more dialogue beats mid-ride
- Multi-block Greenville expansion, NPC traffic, gunplay
- Audio bed / hoof SFX

## Distinct from Golden Hour

- New repo + path (), not a reskin of LoneStar-Next
- No scout camera, scrapbook, film-crew chrome, or gold theme
- Heist-forward horse loop only

## Build


> lone-star-red-county@0.1.0 build
> node build.mjs

built docs/index.html  tip=8a984de  build=0.1.0-17b93bcf  bytes=949604

Pages serves  from . Curl public URL returned **200**.


## Quiet reachability pass (Sep 24, 2026 CT)

Playtest fix so Clean/Botched are reachable — not only Window Closed:

- **World beacons** — tall bone/blood post + pulsing PointLight at alley case; rust beacon at creek drop once carrying.
- **HUD compass** — bone chevron + distance ( / ) toward current objective.
- **Tuning** — window **150s** (was 105);  **3.0** (was 2.2); mounted Act grab verified.
- **Prompts** — periodic Rae distance lines; hitch reminder that alley is behind saloon.
- **Spawn** — horse yaw aimed at alley case so first look isn't empty desert.

Success: from spawn, case beacon readable within ~10s riding toward alley; competent player can Clean without a map.


## Craft standards pass (Sep 24, 2026 CT)

Chris playtest: "looks cool / fun potential" but **cannot see almost anything**; horse was a **Minecraft box horse** — "not how we do it." Story fine. Vertical slice brought up to craft standards (visibility + horse + world readability). **Do not claim playtest PASS for horse beauty** — parent should browser-check.

### Pass 1 — Visibility
- FogExp2 density 0.018 → milder ; background lifted off near-black
- Hemi 0.55→1.05, sun 0.85→1.35, fill 0.25→0.45; ambient + rim lights added
- Exposure 1.05→1.22; case/drop beacons still pulse as primary objectives

### Pass 2 — Horse craft
- Replaced stacked-box mesh with procedural low-poly: Lathe barrel, chest/haunch, arched neck, snout head, ears, mane strip, tail, four jointed legs (upper+knee+hoof)
- Cowboy rider silhouette (coat, legs, boots, arms, hat crown+brim) — not floating cylinder on a box
- Diagonal gait cycles (walk/trot/gallop), body bob + pitch, gallop stretch; Dun steadier accel, Bay sharper; less floaty brake
- Camera tighter/higher (, ) so horse reads in frame
- No external GLTF — pure Three.js for one-tap Pages

### Pass 3 — World readability
- Brighter dusty adobe/dirt (still black/blood/rust/bone, no gold)
- Stronger false-fronts + bone trim; boardwalk lips; hitch posts/caps/ground ring
- Dirt street darker vs lighter shoulders + edge ruts
- Alley mouth gap lighting + frame posts from spawn
- Warm window emissives + brighter street lamps

### Unchanged
- Quiet loop (compass, case, drop, Clean / Botched / Window), touch controls spirit, LoneStar-Next untouched

## Blockers

None for Soft Open Quiet vertical. Headed GPU smoke not automated — play URL is live for Chris / parent browser-check of horse silhouette + dusk readability.
