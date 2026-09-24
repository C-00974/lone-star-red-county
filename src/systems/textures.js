/**
 * Procedural canvas textures — dirt, wood, adobe, leather, signs, sky.
 * Baked at runtime to data-URL / CanvasTexture. No CDN, no gold chrome.
 */
import * as THREE from 'three';

function canvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  return { c, ctx, size };
}

function noise(ctx, size, dens, rgba) {
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (Math.random() > dens) continue;
    const a = (rgba[3] * (0.4 + Math.random() * 0.6)) | 0;
    d[i] = rgba[0];
    d[i + 1] = rgba[1];
    d[i + 2] = rgba[2];
    d[i + 3] = Math.min(255, d[i + 3] + a);
  }
  ctx.putImageData(img, 0, 0);
}

function toTex(c, { wrap = THREE.RepeatWrapping, repeat = [1, 1], colorSpace = THREE.SRGBColorSpace } = {}) {
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = wrap;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.colorSpace = colorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** Dusty dirt street with grit / pebbles. */
export function makeDirtTexture(size = 256) {
  const { c, ctx } = canvas(size);
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, '#6a4428');
  g.addColorStop(0.45, '#5a3820');
  g.addColorStop(1, '#4a2e18');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  // Soft mottling
  for (let i = 0; i < 180; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 4 + Math.random() * 28;
    ctx.fillStyle = `rgba(${70 + Math.random() * 50 | 0},${40 + Math.random() * 30 | 0},${20 + Math.random() * 20 | 0},${0.08 + Math.random() * 0.12})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Grit
  for (let i = 0; i < 2200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const bright = Math.random() > 0.55;
    ctx.fillStyle = bright
      ? `rgba(180,150,110,${0.15 + Math.random() * 0.25})`
      : `rgba(30,18,10,${0.2 + Math.random() * 0.35})`;
    ctx.fillRect(x, y, 1 + (Math.random() > 0.85 ? 1 : 0), 1);
  }
  // Occasional pebble
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(90,70,50,${0.25 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(Math.random() * size, Math.random() * size, 1 + Math.random() * 2.5, 0.8 + Math.random() * 1.5, Math.random(), 0, Math.PI * 2);
    ctx.fill();
  }
  return toTex(c, { repeat: [8, 12] });
}

/** Darker packed street bed. */
export function makeStreetTexture(size = 256) {
  const { c, ctx } = canvas(size);
  ctx.fillStyle = '#3a2414';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = `rgba(${40 + Math.random() * 40 | 0},${25 + Math.random() * 25 | 0},${12 + Math.random() * 15 | 0},${0.1 + Math.random() * 0.15})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 8 + Math.random() * 40, 3 + Math.random() * 12);
  }
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = Math.random() > 0.5
      ? `rgba(120,90,60,${0.1 + Math.random() * 0.2})`
      : `rgba(20,12,8,${0.25 + Math.random() * 0.35})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
  }
  // Wheel rut suggestion
  ctx.strokeStyle = 'rgba(25,15,10,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(size * 0.3, 0);
  ctx.lineTo(size * 0.28, size);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(size * 0.7, 0);
  ctx.lineTo(size * 0.72, size);
  ctx.stroke();
  return toTex(c, { repeat: [2, 14] });
}

/** Wood boardwalk planks. */
export function makeWoodTexture(size = 256) {
  const { c, ctx } = canvas(size);
  ctx.fillStyle = '#4a2e18';
  ctx.fillRect(0, 0, size, size);
  const plankH = size / 6;
  for (let i = 0; i < 6; i++) {
    const y = i * plankH;
    const shade = 55 + (i % 3) * 12 + Math.random() * 10;
    ctx.fillStyle = `rgb(${shade | 0},${(shade * 0.65) | 0},${(shade * 0.35) | 0})`;
    ctx.fillRect(0, y, size, plankH - 1.5);
    // Grain lines
    ctx.strokeStyle = `rgba(30,18,8,${0.15 + Math.random() * 0.2})`;
    ctx.lineWidth = 1;
    for (let g = 0; g < 5; g++) {
      const gy = y + 4 + g * (plankH / 6);
      ctx.beginPath();
      ctx.moveTo(0, gy + Math.sin(g) * 1.5);
      for (let x = 0; x < size; x += 8) {
        ctx.lineTo(x, gy + Math.sin(x * 0.08 + i) * 1.2);
      }
      ctx.stroke();
    }
    // Knot
    if (Math.random() > 0.45) {
      const kx = 20 + Math.random() * (size - 40);
      const ky = y + plankH * 0.4;
      ctx.fillStyle = 'rgba(30,16,8,0.45)';
      ctx.beginPath();
      ctx.ellipse(kx, ky, 4 + Math.random() * 3, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Seam
    ctx.fillStyle = 'rgba(15,8,4,0.55)';
    ctx.fillRect(0, y + plankH - 1.5, size, 1.5);
  }
  return toTex(c, { repeat: [2, 10] });
}

/** Adobe / stucco grain. */
export function makeAdobeTexture(size = 256) {
  const { c, ctx } = canvas(size);
  ctx.fillStyle = '#a08058';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 350; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 3 + Math.random() * 18;
    const v = 140 + Math.random() * 50;
    ctx.fillStyle = `rgba(${v | 0},${(v * 0.8) | 0},${(v * 0.5) | 0},${0.06 + Math.random() * 0.1})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Fine grit
  for (let i = 0; i < 3000; i++) {
    const v = 90 + Math.random() * 80;
    ctx.fillStyle = `rgba(${v | 0},${(v * 0.78) | 0},${(v * 0.48) | 0},${0.12 + Math.random() * 0.2})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
  }
  // Subtle cracks
  ctx.strokeStyle = 'rgba(60,40,25,0.18)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    let x = Math.random() * size;
    let y = Math.random() * size;
    ctx.moveTo(x, y);
    for (let s = 0; s < 6; s++) {
      x += (Math.random() - 0.5) * 40;
      y += 8 + Math.random() * 20;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  return toTex(c, { repeat: [2, 2] });
}

/** Leather saddle / straps. */
export function makeLeatherTexture(size = 128) {
  const { c, ctx } = canvas(size);
  const g = ctx.createRadialGradient(size * 0.4, size * 0.35, 8, size * 0.5, size * 0.5, size * 0.7);
  g.addColorStop(0, '#5a3420');
  g.addColorStop(0.55, '#3a2010');
  g.addColorStop(1, '#241408');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 800; i++) {
    ctx.fillStyle = Math.random() > 0.5
      ? `rgba(120,80,50,${0.08 + Math.random() * 0.15})`
      : `rgba(20,10,5,${0.1 + Math.random() * 0.2})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random(), 1);
  }
  // Worn scuffs
  for (let i = 0; i < 12; i++) {
    ctx.strokeStyle = `rgba(90,60,35,${0.15 + Math.random() * 0.2})`;
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, 6 + Math.random() * 20, 0, Math.PI * (0.4 + Math.random() * 0.8));
    ctx.stroke();
  }
  return toTex(c, { repeat: [1, 1] });
}

/** Horse coat noise (subtle). */
export function makeCoatTexture(hexBase, size = 128) {
  const { c, ctx } = canvas(size);
  ctx.fillStyle = `#${hexBase.toString(16).padStart(6, '0')}`;
  ctx.fillRect(0, 0, size, size);
  // Parse approx RGB
  const r = (hexBase >> 16) & 255;
  const g = (hexBase >> 8) & 255;
  const b = hexBase & 255;
  for (let i = 0; i < 1200; i++) {
    const dr = (Math.random() - 0.5) * 40;
    const dg = (Math.random() - 0.5) * 30;
    const db = (Math.random() - 0.5) * 20;
    ctx.fillStyle = `rgba(${(r + dr) | 0},${(g + dg) | 0},${(b + db) | 0},${0.12 + Math.random() * 0.2})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  return toTex(c, { repeat: [2, 2] });
}

/** Painted false-front / saloon sign with lettering. */
export function makeSignTexture(text, bg = '#7a3820', fg = '#e8dcc8', size = 256) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = Math.round(size * 0.4);
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);
  // Weathered wash
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = `rgba(20,10,5,${0.05 + Math.random() * 0.1})`;
    ctx.fillRect(Math.random() * c.width, Math.random() * c.height, 4 + Math.random() * 20, 2);
  }
  // Border
  ctx.strokeStyle = '#d0c0a0';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, c.width - 12, c.height - 12);
  ctx.strokeStyle = 'rgba(20,8,4,0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, c.width - 20, c.height - 20);
  // Lettering
  ctx.fillStyle = fg;
  ctx.font = `bold ${Math.round(c.height * 0.42)}px "Times New Roman", Palatino, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, c.width / 2, c.height / 2 + 1);
  // Slight blood accent underline
  ctx.fillStyle = '#8b1a1a';
  ctx.fillRect(c.width * 0.28, c.height * 0.78, c.width * 0.44, 3);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Late-afternoon western sky gradient (equirect-ish for sphere). */
export function makeSkyTexture(size = 512) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size / 2;
  const ctx = c.getContext('2d');
  // Vertical sky: zenith → horizon
  const g = ctx.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0, '#4a3a58');       // dusty violet zenith
  g.addColorStop(0.35, '#7a5a68');    // warm dusk mid
  g.addColorStop(0.62, '#c48860');    // amber band
  g.addColorStop(0.78, '#e0a070');    // bright low sun haze
  g.addColorStop(0.9, '#b87048');     // rust horizon
  g.addColorStop(1, '#6a4030');       // ground fade
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  // Soft sun glow on one side
  const sunX = c.width * 0.22;
  const sunY = c.height * 0.72;
  const sg = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, c.height * 0.45);
  sg.addColorStop(0, 'rgba(255,200,140,0.85)');
  sg.addColorStop(0.25, 'rgba(232,140,70,0.45)');
  sg.addColorStop(0.55, 'rgba(180,80,40,0.15)');
  sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, c.width, c.height);
  // Thin cloud wisps
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * c.width;
    const y = c.height * (0.25 + Math.random() * 0.35);
    const w = 40 + Math.random() * 120;
    ctx.fillStyle = `rgba(220,190,170,${0.04 + Math.random() * 0.08})`;
    ctx.beginPath();
    ctx.ellipse(x, y, w, 6 + Math.random() * 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.needsUpdate = true;
  return tex;
}

/** Creek water — subtle ripple pattern + opacity handled by material. */
export function makeWaterTexture(size = 256) {
  const { c, ctx } = canvas(size);
  ctx.fillStyle = '#2a4848';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 40; i++) {
    const y = (i / 40) * size;
    ctx.strokeStyle = `rgba(${60 + Math.random() * 40 | 0},${100 + Math.random() * 40 | 0},${90 + Math.random() * 30 | 0},${0.15 + Math.random() * 0.2})`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= size; x += 8) {
      ctx.lineTo(x, y + Math.sin(x * 0.08 + i) * 3);
    }
    ctx.stroke();
  }
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = `rgba(180,220,210,${0.05 + Math.random() * 0.12})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 1);
  }
  return toTex(c, { repeat: [3, 1.5] });
}

/** Crate / barrel wood (vertical grain). */
export function makeCrateWoodTexture(size = 128) {
  const { c, ctx } = canvas(size);
  ctx.fillStyle = '#4a2a14';
  ctx.fillRect(0, 0, size, size);
  const plankW = size / 4;
  for (let i = 0; i < 4; i++) {
    const x = i * plankW;
    const shade = 50 + (i % 2) * 18;
    ctx.fillStyle = `rgb(${shade},${(shade * 0.6) | 0},${(shade * 0.3) | 0})`;
    ctx.fillRect(x, 0, plankW - 2, size);
    ctx.fillStyle = 'rgba(20,10,5,0.4)';
    ctx.fillRect(x + plankW - 2, 0, 2, size);
  }
  // Bands
  ctx.fillStyle = 'rgba(90,50,25,0.55)';
  ctx.fillRect(0, size * 0.2, size, 4);
  ctx.fillRect(0, size * 0.75, size, 4);
  return toTex(c, { repeat: [1, 1] });
}
