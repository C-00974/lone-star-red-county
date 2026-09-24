// Procedural sky dome: late-afternoon / early western dusk over Red County — rust/amber sun, cool opposite fill. Soft Open locks mid-dusk.
// Sun disc + Mie glow, Rayleigh-ish gradient, a domain-warped cumulus deck (dark bellies, gold rims) that breaks up
// toward the sun, a cumulonimbus wall receding east over downtown (flat rain-dark base, sunlit turrets, anvil), a thin
// wind-stretched cirrus layer that catches the last light, Belt of Venus / earth shadow at dusk, stars and the city
// light dome at night.
// Also drives the per-phase palette used by lighting.js for fog, sun, hemisphere and environment, and owns the
// directional, height-aware scene fog (patchFogChunks) so distant ground fogs into the dome that is actually behind it.
import * as THREE from 'three';
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- directional / height-aware scene fog
// three's FogExp2 is one colour for every view direction; the dome is not (cream toward the sun, grey-blue toward the
// storm), so distant ground looking into the sun used to fog to blue-grey against a cream sky. The fog shader chunks are
// swapped here, at import time (before any material compiles), for a version that
//  - blends the scene fog colour (east horizon, set by lighting.js from state.fog) toward a sun-side colour with the
//    same sunSide = pow(dot(dir.xz, sunAz), 1.8) weight the dome uses,
//  - thins the haze with height (aerial perspective: the haze sits in the floodway, tower shafts stand above it).
// The two extra uniforms are shared typed arrays injected into every ShaderLib entry that has fog: UniformsUtils.clone
// copies typed arrays by reference, so one in-place write from setPhase reaches every compiled material.
// fogColor / fogDensity are re-pointed with macros after their declaration, so modules that inline their own fog mix
// (skyline's nightPunch) pick up the directional colour and the height falloff without changes.
const FOG = { fogColorSun: { value: new Float32Array([0.55, 0.45, 0.38]) }, fogDirParams: { value: new Float32Array([-1, 0, 0.45, 0]) } };
let fogPatched = false;
function patchFogChunks() {
  if (fogPatched) return; fogPatched = true;
  const C = THREE.ShaderChunk;
  C.fog_pars_vertex = /* glsl */`
#ifdef USE_FOG
	varying float vFogDepth;
	varying vec3 vFogDir;
#endif`;
  C.fog_vertex = /* glsl */`
#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
	vFogDir = mvPosition.xyz * mat3( viewMatrix );
#endif`;
  C.fog_pars_fragment = /* glsl */`
#ifdef USE_FOG
	uniform vec3 fogColor;
	uniform vec3 fogColorSun;
	uniform vec4 fogDirParams;
	varying float vFogDepth;
	varying vec3 vFogDir;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
	vec3 lsFogColor() {
		float l = length( vFogDir.xz );
		float az = l > 1e-4 ? dot( vFogDir.xz / l, fogDirParams.xy ) : 0.0;
		return mix( fogColor, fogColorSun, pow( max( az, 0.0 ), 1.8 ) );
	}
	#define fogColor lsFogColor()
	#ifdef FOG_EXP2
		float lsFogDensity() {
			float hm = cameraPosition.y + 0.5 * vFogDir.y;
			return fogDensity * mix( 1.0, fogDirParams.z, smoothstep( 25.0, 170.0, hm ) );
		}
		#define fogDensity lsFogDensity()
	#endif
#endif`;
  C.fog_fragment = /* glsl */`
#ifdef USE_FOG
	#ifdef FOG_EXP2
		float lsFogD = fogDensity;
		float fogFactor = 1.0 - exp( - lsFogD * lsFogD * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`;
  for (const k of Object.keys(THREE.ShaderLib)) { const u = THREE.ShaderLib[k].uniforms; if (u && u.fogColor) { u.fogColorSun = FOG.fogColorSun; u.fogDirParams = FOG.fogDirParams; } }
}
patchFogChunks();

const vert = /* glsl */`
varying vec3 vDir;
void main(){ vDir = normalize((modelMatrix * vec4(position,1.0)).xyz - cameraPosition); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;

// Cost: cumulus = 4 value-noise octaves (with analytic derivatives, so the gradient used for rim lighting and the
// domain warp are free), cirrus = 2 octaves, storm wall (east half only) = 7 plain octaves. Stars add 4 cheap hashes.
const frag = /* glsl */`
precision highp float;
varying vec3 vDir;
uniform vec3 uSunDir; uniform vec3 uSunColor; uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uHorizonSun; uniform vec3 uGround;
uniform vec3 uCloudLit; uniform vec3 uCloudShade; uniform vec3 uCloudDark; uniform vec3 uCirrus; uniform vec3 uCityDir; uniform vec3 uCityGlow;
uniform float uTime; uniform float uNight; uniform float uStormEast; uniform float uExposure; uniform float uCoverage; uniform float uVenus; uniform float uStars; uniform float uSunGlow;

float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float hash3(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
// value noise with analytic derivative: (value, d/dx, d/dy)
vec3 noised(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f), du = 6.0*f*(1.0-f);
  float a = hash(i), b = hash(i+vec2(1.0,0.0)), c = hash(i+vec2(0.0,1.0)), d = hash(i+vec2(1.0,1.0));
  float k1 = b-a, k2 = c-a, k3 = a-b-c+d;
  return vec3(a + k1*u.x + k2*u.y + k3*u.x*u.y, du * vec2(k1 + k3*u.y, k2 + k3*u.x));
}
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
// 4-octave fbm with gradient; the curl of the lower octaves warps the higher ones (billowy cauliflower edges).
// d3/d4 (0..1) fade the third and fourth octave out toward the horizon, where the plane projection makes them alias.
vec3 cumulusFbm(vec2 p, float d3, float d4){
  vec3 n = noised(p);
  float v = 0.5 * n.x; vec2 g = 0.5 * n.yz;
  p = p * 2.02 + 0.45 * vec2(n.z, -n.y) + vec2(3.1, 7.7);
  n = noised(p); v += 0.25 * n.x; g += 0.505 * n.yz;
  if (d3 > 0.001) {
    p = p * 2.03 + 0.22 * vec2(n.z, -n.y) + vec2(1.7, 9.2);
    n = noised(p); v += 0.125 * d3 * n.x; g += 0.51 * d3 * n.yz;
    if (d4 > 0.001) { p = p * 2.01 + vec2(8.3, 2.8); n = noised(p); v += 0.0625 * d4 * n.x; g += 0.515 * d4 * n.yz; }
  }
  return vec3(v, g) / (0.75 + 0.125 * d3 + 0.0625 * d4);
}
vec3 cumulusLow(vec2 p){
  vec3 n = noised(p);
  float v = 0.5 * n.x; vec2 g = 0.5 * n.yz;
  p = p * 2.02 + 0.45 * vec2(n.z, -n.y) + vec2(3.1, 7.7);
  n = noised(p); v += 0.25 * n.x; g += 0.505 * n.yz;
  return vec3(v, g) / 0.75;
}
void main(){
  vec3 d = normalize(vDir);
  float h = d.y, hp = max(h, 0.0);
  float sunDot = dot(d, uSunDir), sunDotP = max(sunDot, 0.0);
  vec2 d2 = normalize(d.xz + vec2(1e-5, 0.0)), s2 = normalize(uSunDir.xz + vec2(1e-5, 0.0));
  float az = dot(d2, s2);
  float sunSide = pow(max(az, 0.0), 1.8), antiSide = pow(max(-az, 0.0), 2.0);
  float lowSun = 1.0 - smoothstep(0.0, 0.35, hp);
  float hz = exp(-hp * 11.0);                                          // horizon haze band
  float east = smoothstep(-0.55, 0.85, d.x) * uStormEast;               // storm side: thicker deck, darker bases
  float sunUp = 0.3 + 0.7 * smoothstep(-0.08, 0.06, uSunDir.y);        // below the horizon only the tops keep a glow
  // ---- clear sky: Rayleigh-ish blue overhead, haze at the horizon, warm Mie scattering toward the sun
  vec3 hor = mix(uHorizon, uHorizonSun, sunSide * (0.3 + 0.7 * hz));      // saturated at the horizon, grey-blue (not purple) higher up
  vec3 col = mix(hor, uZenith, pow(hp, 0.5));
  col = mix(col, hor, hz * 0.3);
  col += uHorizonSun * sunSide * hz * 0.25 * uSunGlow;
  // Belt of Venus (pink band) over the blue-grey earth shadow, opposite the sun, at dusk
  float venusBand = exp(-pow((hp - 0.09) / 0.07, 2.0));
  col += vec3(0.80, 0.38, 0.46) * venusBand * antiSide * uVenus * 0.18;
  col = mix(col, mix(uZenith, uHorizon, 0.4) * 0.85, antiSide * (1.0 - smoothstep(0.0, 0.07, hp)) * uVenus * 0.5);
  // city light dome over downtown (east) at night
  float city = pow(max(dot(d2, normalize(uCityDir.xz + vec2(1e-5, 0.0))), 0.0), 5.0) * exp(-hp * 9.0);
  col += uCityGlow * city;
  // below the horizon: distant hazy ground, in the fog colour of that direction
  if (h < 0.0) col = mix(hor * 0.94, mix(uGround, hor * 0.7, 0.5), smoothstep(0.0, -0.10, h));
  // ---- sun disc and Mie corona (stronger through the thick low-angle air); the disc is capped so ACES keeps an orange core
  float disc = smoothstep(0.99972, 0.99991, sunDot);
  // tight corona in the sun colour; the broad low-angle glow takes the horizon orange so it does not wash to white
  float mieT = 0.6 * pow(sunDotP, 400.0) + 0.22 * pow(sunDotP, 40.0), mieW = 0.10 * pow(sunDotP, 6.0) + 0.05 * pow(sunDotP, 1.5);
  vec3 sunGlow = uSunColor * disc * 3.0 * (1.0 - uNight) + (uSunColor * mieT + mix(uSunColor, uHorizonSun, 0.6) * mieW) * 0.55 * (1.0 + 0.8 * lowSun) * uSunGlow;
  col += sunGlow * smoothstep(-0.01, 0.0, h);
  // ---- clouds
  float cloudA = 0.0, cirA = 0.0; vec3 cloudC = vec3(0.0), cirC = vec3(0.0);
  if (h > 0.002) {
    vec2 drift = vec2(uTime * 0.010, uTime * 0.0025);
    vec3 apCol = hor;                                                    // what the low deck fades into with distance
    // ---- storm wall: the cumulonimbus receding east over downtown. A flat rain-dark base a few degrees up, a grey-blue
    // body, turrets lit gold by the low sun behind the viewer and a thin anvil shelf spreading above them.
    float eastAz = smoothstep(-0.15, 0.65, d.x) * uStormEast;
    if (eastAz > 0.001) {
      float ang = asin(clamp(d2.y, -1.0, 1.0));                          // bearing off due east, continuous across it
      vec2 wuv = vec2(ang * 2.6, hp * 7.0) + vec2(uTime * 0.002, 0.0);
      float wn = 0.55 * noise(wuv + vec2(2.0, 5.0)) + 0.30 * noise(wuv * 2.1 + vec2(7.0, 3.0)) + 0.15 * noise(wuv * 4.3 + vec2(1.0, 8.0));
      float turret = 0.5 * noise(vec2(ang * 1.6 + 3.0, 1.5)) + 0.5 * noise(vec2(ang * 3.9 + 1.0, 2.5));
      float topH = 0.17 + 0.16 * turret, baseH = 0.045 + 0.03 * noise(vec2(ang * 4.5, 9.0));
      float tRel = clamp((hp - baseH) / max(topH - baseH, 0.02), 0.0, 1.0);
      float topEdge = topH + 0.05 * (wn - 0.5);
      float wallD = eastAz * smoothstep(baseH - 0.015, baseH + 0.015, hp) * (1.0 - smoothstep(topEdge - 0.03, topEdge + 0.01, hp));
      wallD *= smoothstep(0.22, 0.42, wn * 0.6 + 0.4 * eastAz);       // ragged flanks north and south of the cell
      float lit = smoothstep(0.35, 0.95, tRel + 0.3 * (wn - 0.5)) * sunUp;
      vec3 wcol = mix(uCloudDark * 0.5, uCloudShade * 0.85, smoothstep(0.0, 0.85, tRel)) * (0.8 + 0.4 * wn);
      wcol = mix(wcol, uCloudLit * (0.9 + 0.3 * wn), lit);
      wcol = mix(wcol, hor, 0.10 + 0.12 * (1.0 - tRel));                // distance haze, strongest on the lower body
      apCol = mix(hor, wcol, wallD * 0.7);                              // the deck in front fades toward the storm, not the clear horizon
      float anvil = smoothstep(topEdge + 0.01, topEdge + 0.05, hp) * (1.0 - smoothstep(topEdge + 0.08, topEdge + 0.2, hp)) * eastAz * smoothstep(0.3, 0.7, noise(wuv * vec2(0.7, 1.4) + vec2(4.0, 2.0)));
      vec3 acol = mix(mix(uCloudLit, uCirrus, 0.5), uCloudShade, 1.0 - sunUp);
      col = mix(col, acol, anvil * 0.55);
      col = mix(col, wcol, wallD);
      // rain still falling under the wall: dark virga streaks down to the horizon
      col = mix(col, uCloudDark * 0.9, eastAz * (1.0 - smoothstep(baseH - 0.03, baseH + 0.02, hp)) * 0.45 * (0.4 + 0.7 * wn));
    }
    // ---- low cumulus deck: bases on one plane, tops on a plane 25% higher. The parallax between the two reveals the
    // cloud walls (front-lit gold when the sun is behind you, backlit when you look toward it).
    float pl = 1.0 / (h + 0.1);
    vec2 puv = d.xz * pl;
    float det3 = smoothstep(0.03, 0.16, hp), det4 = smoothstep(0.07, 0.30, hp);
    vec3 cb = cumulusFbm(puv + drift, det3, det4);
    vec3 ct = cumulusLow(puv * 1.5 + drift);
    // raw fbm sits in ~0.35..0.8 (p50 0.5, p99 0.79): stretch it so the thick/belly thresholds below actually bite
    cb.x = clamp((cb.x - 0.32) * 2.1, 0.0, 1.0); cb.yz *= 2.1;
    ct.x = clamp((ct.x - 0.32) * 2.1, 0.0, 1.0);
    // coverage: broken field in the west (clear at the sun-side horizon), denser deck over the storm in the east
    float cluster = noise(puv * 0.22 + drift * 0.3 + vec2(11.0, 5.0));     // big/small cloud groups
    float thr = mix(0.64, 0.50, east) - (uCoverage - 0.5) * 0.4 + 0.18 * (1.0 - east) * (1.0 - smoothstep(0.0, 0.3, hp)) + (cluster - 0.5) * 0.22;
    float dBase = smoothstep(thr, thr + 0.08, cb.x);
    float thick = smoothstep(thr + 0.03, thr + 0.22, cb.x);
    float dTop = smoothstep(thr + 0.05, thr + 0.22, ct.x);
    float wall = dTop * (1.0 - dBase);
    float dens = dBase + wall;
    // lighting: base flanks toward the sun (density gradient), walls that face both the viewer and the sun
    vec2 sunUV = uSunDir.xz / max(uSunDir.y, 0.03);
    vec2 toSun = normalize(sunUV - puv);
    vec2 gn = cb.yz / (length(cb.yz) + 0.3);
    float facing = dot(gn, -toSun);
    vec2 nWall = -normalize(puv + vec2(1e-4, 0.0));
    float fwd = pow(sunDotP, 5.0);                                       // looking toward the sun: backlit
    float wallLit = smoothstep(-0.25, 0.6, dot(nWall, s2)) * (1.0 - 0.6 * fwd) * (0.55 + 0.45 * smoothstep(-0.3, 0.6, facing)) * sunUp;
    float belly = thick * (0.7 + 0.3 * hp);                               // looking up = undersides in shadow
    vec3 base = mix(uCloudShade, uCloudDark, belly * (0.45 + 0.55 * east));
    float litB = smoothstep(0.2, 0.8, facing) * (1.0 - 0.85 * belly) * (1.0 - 0.7 * fwd) * (0.45 + 0.55 * (1.0 - hp)) * sunUp;
    vec3 cBase = mix(base, uCloudLit, litB);
    vec3 cWall = mix(uCloudShade * 0.9, uCloudLit, wallLit);
    vec3 c = (cBase * dBase + cWall * wall) / max(dens, 1e-3);
    float edge = dens * (1.0 - thick);                                   // thin margins
    c += uSunColor * edge * (0.3 * pow(sunDotP, 3.0) + 1.6 * pow(sunDotP, 24.0)) * uSunGlow;    // silver lining
    c += uSunColor * (1.0 - thick) * pow(sunDotP, 40.0) * 0.5 * uSunGlow;                       // glow through thin cloud
    c += uCityGlow * city * 1.5 * belly;                                                          // bellies lit by the city at night
    c = mix(apCol, c, 1.0 - exp(-hp * 10.0));                                                    // aerial perspective
    cloudA = dens * smoothstep(0.0, 0.015, hp);
    cloudC = c;
    // high cirrus: thin, wind-stretched, warmed by the sun; thinner near the sun so the gold there is not veiled
    vec2 uv2 = d.xz / (h + 0.22) * 0.9;
    uv2 = mat2(0.87, -0.5, 0.5, 0.87) * uv2 * vec2(0.45, 2.2) + vec2(uTime * 0.003, 0.0);
    float cv = 0.65 * noise(uv2) + 0.35 * noise(uv2 * 2.7 + vec2(4.2, 1.3));
    float nearSun = smoothstep(0.64, 0.85, sunDot);
    float cir = smoothstep(0.54, 0.80, cv) * mix(0.26, 0.12, nearSun);
    vec3 cc = mix(uCirrus, uSunColor * 0.95, pow(sunDotP, 3.0) * 0.6);
    cirC = mix(hor, cc, 1.0 - exp(-hp * 6.0));
    cirA = cir * smoothstep(0.0, 0.08, hp);
  }
  // ---- stars (hidden behind cloud)
  if (uStars > 0.01 && h > 0.02) {
    vec3 sp = d * 120.0; vec3 ci = floor(sp); vec3 fp = fract(sp) - 0.5;
    float r = hash3(ci);
    vec3 off = (vec3(hash3(ci + 1.7), hash3(ci + 4.3), hash3(ci + 9.1)) - 0.5) * 0.6;
    float dd = dot(fp - off, fp - off);
    float star = smoothstep(0.972, 1.0, r) * exp(-dd * 40.0) * mix(0.25, 1.0, hash3(ci + 2.2));
    float tw = 0.8 + 0.2 * sin(uTime * 2.5 + r * 60.0);
    col += vec3(0.85, 0.9, 1.0) * star * tw * uStars * smoothstep(0.02, 0.3, h) * 0.9;
  }
  col = mix(col, cirC, cirA);
  col = mix(col, cloudC, cloudA);
  col *= uExposure;
  gl_FragColor = vec4(col, 1.0);
}`;

export function createSky(scene) {
  const uniforms = {
    uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunColor: { value: new THREE.Color(1, 0.8, 0.55) },
    uZenith: { value: new THREE.Color(0.16, 0.34, 0.68) }, uHorizon: { value: new THREE.Color(0.62, 0.64, 0.70) }, uHorizonSun: { value: new THREE.Color(1.0, 0.62, 0.30) },
    uGround: { value: new THREE.Color(0.30, 0.29, 0.28) },
    uCloudLit: { value: new THREE.Color(1.0, 0.82, 0.58) }, uCloudShade: { value: new THREE.Color(0.42, 0.44, 0.52) }, uCloudDark: { value: new THREE.Color(0.22, 0.23, 0.28) }, uCirrus: { value: new THREE.Color(0.85, 0.80, 0.80) },
    uCityDir: { value: new THREE.Vector3(0.95, 0, 0.30).normalize() }, uCityGlow: { value: new THREE.Color(0, 0, 0) },
    uTime: { value: 0 }, uNight: { value: 0 }, uStormEast: { value: 1 }, uExposure: { value: 1 }, uCoverage: { value: 0.5 }, uVenus: { value: 0 }, uStars: { value: 0 }, uSunGlow: { value: 1 },
  };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag, side: THREE.BackSide, depthWrite: false, fog: false });
  // The dome is direction-only (vDir), so its radius is free: it rides along with whichever camera draws it and is
  // scaled to sit just inside that camera's far plane (renderer.js derives far from the quality draw distance, down to
  // 2600 m at Low) so the far plane can never clip a cap out of the sky. The env-map clone (lighting.js) keeps the base
  // radius and the origin, which is where the PMREM cube camera sits.
  const R_DOME = 720;
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(R_DOME, 48, 24), mat); mesh.name = 'sky'; mesh.frustumCulled = false; mesh.renderOrder = -10;
  const camPos = new THREE.Vector3();
  mesh.onBeforeRender = (renderer, sc, camera) => {
    camPos.setFromMatrixPosition(camera.matrixWorld);
    const s = Math.min(1, (camera.far || 1e9) * 0.92 / R_DOME);
    if (!mesh.position.equals(camPos) || mesh.scale.x !== s) { mesh.position.copy(camPos); mesh.scale.setScalar(s); mesh.updateMatrixWorld(true); }
  };
  scene.add(mesh);
  // Palettes (linear RGB) keyed by phase: 0 golden hour (sun 12 deg, storm receding east) -> 1 late (sun 5 deg, deeper
  // orange, purple-grey clouds) -> 2 dusk (sun below the horizon, salmon/violet, first stars, city lights) -> 3 night.
  // Light intensities are three's physical units (radiance = I * albedo / pi * cos): the low sun has to be strong so that
  // sun-facing verticals, not the sky-lit ground, are the brightest surfaces; env/hemi are kept low for the same reason.
  // Fog: fogDensity is the ground-level haze (post-storm air is clear: ~30% at the 1.5 km downtown towers), fogHeightK
  // the fraction left high above the floodway (tower shafts). fog / fogSun colours are derived from the dome (fogColors).
  const P = {
    golden: { zenith: [0.045, 0.13, 0.42], horizon: [0.30, 0.33, 0.44], horizonSun: [0.92, 0.38, 0.12], sun: [1.0, 0.55, 0.28], elev: 12,
      cloudLit: [1.05, 0.48, 0.22], cloudShade: [0.25, 0.28, 0.37], cloudDark: [0.10, 0.11, 0.15], cirrus: [0.80, 0.62, 0.42], cityGlow: [0, 0, 0],
      fogDensity: 0.0035, fogHeightK: 0.4, hemiSky: [0.40, 0.52, 0.80], hemiGround: [0.42, 0.34, 0.24], fill: [0.50, 0.58, 0.80],
      sunI: 5.5, hemiI: 0.22, fillI: 0.12, envI: 0.35, night: 0, exposure: 1.0, coverage: 0.5, stormEast: 0.35, venus: 0.15, stars: 0, sunGlow: 1.0 },
    late:   { zenith: [0.04, 0.10, 0.36], horizon: [0.28, 0.25, 0.38], horizonSun: [0.90, 0.30, 0.07], sun: [1.0, 0.52, 0.26], elev: 5,
      cloudLit: [0.95, 0.42, 0.18], cloudShade: [0.17, 0.15, 0.25], cloudDark: [0.06, 0.055, 0.10], cirrus: [0.85, 0.45, 0.40], cityGlow: [0, 0, 0],
      fogDensity: 0.0040, fogHeightK: 0.45, hemiSky: [0.34, 0.36, 0.62], hemiGround: [0.32, 0.24, 0.17], fill: [0.40, 0.40, 0.66],
      sunI: 3.4, hemiI: 0.42, fillI: 0.16, envI: 0.5, night: 0.1, exposure: 1.0, coverage: 0.48, stormEast: 0.30, venus: 0.6, stars: 0, sunGlow: 1.0 },
    dusk:   { zenith: [0.018, 0.028, 0.10], horizon: [0.14, 0.12, 0.20], horizonSun: [0.80, 0.30, 0.12], sun: [1.0, 0.50, 0.30], elev: -4,
      cloudLit: [0.17, 0.085, 0.10], cloudShade: [0.05, 0.045, 0.085], cloudDark: [0.02, 0.02, 0.04], cirrus: [0.55, 0.26, 0.26], cityGlow: [0.06, 0.035, 0.02],
      fogDensity: 0.0045, fogHeightK: 0.55, hemiSky: [0.22, 0.24, 0.40], hemiGround: [0.18, 0.14, 0.12], fill: [0.32, 0.30, 0.48],
      sunI: 0.0, hemiI: 0.95, fillI: 0.32, envI: 0.65, night: 0.8, exposure: 1.12, coverage: 0.42, stormEast: 0.7, venus: 1.0, stars: 0.35, sunGlow: 0.7 },
    night:  { zenith: [0.012, 0.016, 0.045], horizon: [0.07, 0.07, 0.11], horizonSun: [0.12, 0.08, 0.09], sun: [0.6, 0.4, 0.3], elev: -12,
      cloudLit: [0.045, 0.045, 0.06], cloudShade: [0.03, 0.03, 0.05], cloudDark: [0.015, 0.015, 0.025], cirrus: [0.04, 0.04, 0.055], cityGlow: [0.12, 0.07, 0.04],
      fogDensity: 0.00455, fogHeightK: 0.55, hemiSky: [0.22, 0.26, 0.40], hemiGround: [0.14, 0.12, 0.12], fill: [0.22, 0.24, 0.38],
      sunI: 0.0, hemiI: 1.15, fillI: 0.42, envI: 0.7, night: 1, exposure: 1.2, coverage: 0.38, stormEast: 0.5, venus: 0, stars: 1, sunGlow: 0.0 },
  };
  const keys = ['golden', 'late', 'dusk', 'night'];
  const cur = {};
  const mixc = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  /** The clear-sky part of the dome (same math as the shader, no disc/Mie) at elevation hp for a given sunSide weight. */
  function domeClear(s, sunSide, hp) {
    const hz = Math.exp(-hp * 11);
    const hor = mixc(s.horizon, s.horizonSun, sunSide * (0.3 + 0.7 * hz));
    let c = mixc(hor, s.zenith, Math.sqrt(hp));
    c = mixc(c, hor, hz * 0.3);
    c = c.map((v, i) => v + s.horizonSun[i] * sunSide * hz * 0.25 * s.sunGlow);
    return { hor, c };
  }
  /** Scene fog colours: the dome just above the horizon toward the storm (east: virga and the deck's undersides
   *  included; used by lighting.js as scene.fog.color) and toward the sun. The patched fog chunk blends between the two
   *  by view azimuth, so distant ground dissolves into whichever part of the dome is actually behind it. */
  function fogColors(s) {
    const hp = 0.04, east = s.stormEast;
    let { hor, c } = domeClear(s, 0, hp);
    const vb = Math.exp(-Math.pow((hp - 0.09) / 0.07, 2)) * s.venus * 0.18; c = [c[0] + 0.8 * vb, c[1] + 0.38 * vb, c[2] + 0.46 * vb];
    c = mixc(c, mixc(s.zenith, s.horizon, 0.4).map((v) => v * 0.85), (1 - smoothstep(0, 0.07, hp)) * s.venus * 0.5);
    c = c.map((v, i) => v + s.cityGlow[i] * 0.6);
    c = mixc(c, s.cloudDark.map((v) => v * 0.9), east * (1 - smoothstep(0.03, 0.08, hp)) * 0.45 * 0.75);   // virga under the wall
    let cl = mixc(s.cloudShade, s.cloudDark, 0.6 * (0.45 + 0.55 * east)); cl = mixc(hor, cl, 1 - Math.exp(-hp * 10));
    const fog = mixc(c, cl, 0.15 + 0.35 * east).map((v) => v * s.exposure);
    const S = domeClear(s, 1, hp);
    let cs = S.c.map((v, i) => v + s.sun[i] * 0.05 * s.sunGlow);
    cs = mixc(cs, mixc(S.hor, mixc(s.cloudShade, s.cloudLit, 0.5), 1 - Math.exp(-hp * 10)), 0.1);
    return { fog, fogSun: cs.map((v) => v * s.exposure) };
  }
  function evalPhase(phase) { // phase 0..3
    const p = clamp(phase, 0, 3), i = Math.min(2, Math.floor(p)), t = smoothstep(0, 1, p - i), A = P[keys[i]], B = P[keys[i + 1]];
    for (const k of Object.keys(A)) cur[k] = Array.isArray(A[k]) ? A[k].map((v, j) => lerp(v, B[k][j], t)) : lerp(A[k], B[k], t);
    const f = fogColors(cur); cur.fog = f.fog; cur.fogSun = f.fogSun; cur.ground = cur.fog.map((v) => v * 0.9);
    return cur;
  }
  const sunDir = new THREE.Vector3();
  const api = {
    mesh, uniforms, sunDir, phase: 0, azimuthDeg: 255, state: cur,
    setPhase(phase) {
      api.phase = phase; const s = evalPhase(phase);
      const el = s.elev * Math.PI / 180, az = api.azimuthDeg * Math.PI / 180;
      // azimuth: 0 = north (-z), 90 = east (+x)
      sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
      uniforms.uSunDir.value.copy(sunDir);
      uniforms.uSunColor.value.setRGB(...s.sun); uniforms.uZenith.value.setRGB(...s.zenith); uniforms.uHorizon.value.setRGB(...s.horizon); uniforms.uHorizonSun.value.setRGB(...s.horizonSun);
      uniforms.uGround.value.setRGB(...s.ground);
      uniforms.uCloudLit.value.setRGB(...s.cloudLit); uniforms.uCloudShade.value.setRGB(...s.cloudShade); uniforms.uCloudDark.value.setRGB(...s.cloudDark); uniforms.uCirrus.value.setRGB(...s.cirrus);
      uniforms.uCityGlow.value.setRGB(...s.cityGlow);
      uniforms.uNight.value = s.night; uniforms.uExposure.value = s.exposure; uniforms.uStormEast.value = s.stormEast; uniforms.uCoverage.value = s.coverage;
      uniforms.uVenus.value = s.venus; uniforms.uStars.value = s.stars; uniforms.uSunGlow.value = s.sunGlow;
      // directional / height-aware scene fog (shared with every fog-capable material, see patchFogChunks)
      const l = Math.hypot(sunDir.x, sunDir.z) || 1;
      FOG.fogDirParams.value[0] = sunDir.x / l; FOG.fogDirParams.value[1] = sunDir.z / l; FOG.fogDirParams.value[2] = s.fogHeightK;
      FOG.fogColorSun.value[0] = s.fogSun[0]; FOG.fogColorSun.value[1] = s.fogSun[1]; FOG.fogColorSun.value[2] = s.fogSun[2];
      return s;
    },
    update(dt) { uniforms.uTime.value += dt; },
  };
  api.setPhase(0);
  return api;
}
