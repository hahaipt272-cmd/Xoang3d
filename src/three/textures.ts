import * as THREE from 'three';
import { BottleSpec, EnvironmentLocation, WallStyle } from '../types/game';

export interface WallTextureSet {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}

export interface ImpactOverlayHandle {
  texture: THREE.CanvasTexture;
  stampImpact: (
    u: number,
    v: number,
    liquidHex: number,
    radiusPx: number,
    surface: WallStyle,
  ) => void;
  clear: () => void;
  dispose: () => void;
}

function seededRand(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function createWallTextures(
  style: WallStyle,
  maxAnisotropy: number,
): WallTextureSet {
  const size = 1024;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  const seed =
    style === 'brick' ? 101 : style === 'concrete' ? 202 : style === 'glass_window' ? 404 : 303;
  const rand = seededRand(seed);

  if (style === 'brick') {
    ctx.fillStyle = '#4a433d';
    ctx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#383838';
    bCtx.fillRect(0, 0, size, size);

    const rows = 16;
    const cols = 8;
    const rowH = size / rows;
    const colW = size / cols;
    const gap = 6;

    for (let r = 0; r < rows; r++) {
      const offset = r % 2 === 0 ? 0 : colW * 0.5;
      for (let c = -1; c <= cols; c++) {
        const x = c * colW + offset + gap * 0.5;
        const y = r * rowH + gap * 0.5;
        const w = colW - gap;
        const h = rowH - gap;

        const shade = rand();
        const red = Math.floor(118 + shade * 42);
        const green = Math.floor(48 + shade * 24);
        const blue = Math.floor(38 + shade * 18);
        ctx.fillStyle = `rgb(${red},${green},${blue})`;
        ctx.fillRect(x, y, w, h);

        const bVal = Math.floor(165 + shade * 55);
        bCtx.fillStyle = `rgb(${bVal},${bVal},${bVal})`;
        bCtx.fillRect(x, y, w, h);

        for (let s = 0; s < 14; s++) {
          const sx = x + rand() * w;
          const sy = y + rand() * h;
          const sr = 2 + rand() * 7;
          ctx.fillStyle = rand() > 0.5 ? 'rgba(20,14,12,0.18)' : 'rgba(210,160,130,0.09)';
          ctx.fillRect(sx, sy, sr, sr * 0.7);
          bCtx.fillStyle = rand() > 0.5 ? 'rgba(90,90,90,0.35)' : 'rgba(235,235,235,0.22)';
          bCtx.fillRect(sx, sy, sr, sr * 0.7);
        }
      }
    }

    const grime = ctx.createLinearGradient(0, size * 0.7, 0, size);
    grime.addColorStop(0, 'rgba(18,16,14,0)');
    grime.addColorStop(1, 'rgba(18,16,14,0.48)');
    ctx.fillStyle = grime;
    ctx.fillRect(0, 0, size, size);
  } else if (style === 'concrete') {
    ctx.fillStyle = '#5c6066';
    ctx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    for (let i = 0; i < 6500; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const sz = 1 + rand() * 4;
      const v = Math.floor(70 + rand() * 55);
      ctx.fillStyle = `rgba(${v},${v + 2},${v + 5},0.32)`;
      ctx.fillRect(x, y, sz, sz);
      const bv = Math.floor(105 + rand() * 55);
      bCtx.fillStyle = `rgba(${bv},${bv},${bv},0.35)`;
      bCtx.fillRect(x, y, sz, sz);
    }

    ctx.strokeStyle = 'rgba(26,28,32,0.55)';
    ctx.lineWidth = 4;
    bCtx.strokeStyle = '#303030';
    bCtx.lineWidth = 5;
    for (let p = 1; p < 4; p++) {
      const pos = (size / 4) * p;
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(size, pos);
      ctx.stroke();
      bCtx.beginPath();
      bCtx.moveTo(0, pos);
      bCtx.lineTo(size, pos);
      bCtx.stroke();

      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, size);
      ctx.stroke();
      bCtx.beginPath();
      bCtx.moveTo(pos, 0);
      bCtx.lineTo(pos, size);
      bCtx.stroke();
    }

    for (let py = 0; py < 4; py++) {
      for (let px = 0; px < 4; px++) {
        const cx = (px + 0.5) * (size / 4);
        const cy = (py + 0.5) * (size / 4);
        for (const ox of [-75, 75]) {
          ctx.fillStyle = '#25282c';
          ctx.beginPath();
          ctx.arc(cx + ox, cy, 7, 0, Math.PI * 2);
          ctx.fill();
          bCtx.fillStyle = '#181818';
          bCtx.beginPath();
          bCtx.arc(cx + ox, cy, 8, 0, Math.PI * 2);
          bCtx.fill();
        }
      }
    }
  } else if (style === 'glass_window') {
    // Cool teal-slate reflective architectural glass panes with dark steel mullions
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#5a8394');
    grad.addColorStop(0.5, '#77a8ba');
    grad.addColorStop(1, '#446878');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    // Subtle diagonal glass reflections
    ctx.fillStyle = 'rgba(235, 250, 255, 0.16)';
    for (let i = 0; i < 4; i++) {
      const x = i * 260;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 90, 0);
      ctx.lineTo(x - 160, size);
      ctx.lineTo(x - 250, size);
      ctx.closePath();
      ctx.fill();
    }

    // Steel window mullion grid (4x2 panes)
    const cols = 4;
    const rows = 2;
    ctx.strokeStyle = '#1e242c';
    ctx.lineWidth = 22;
    bCtx.strokeStyle = '#d8d8d8';
    bCtx.lineWidth = 24;
    for (let c = 0; c <= cols; c++) {
      const x = (c / cols) * size;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
      bCtx.beginPath();
      bCtx.moveTo(x, 0);
      bCtx.lineTo(x, size);
      bCtx.stroke();
    }
    for (let r = 0; r <= rows; r++) {
      const y = (r / rows) * size;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
      bCtx.beginPath();
      bCtx.moveTo(0, y);
      bCtx.lineTo(size, y);
      bCtx.stroke();
    }
  } else {
    // Corrugated galvanized metal sheet
    ctx.fillStyle = '#3a404a';
    ctx.fillRect(0, 0, size, size);

    // Vertical corrugation ribs
    const ribs = 24;
    const ribW = size / ribs;
    for (let i = 0; i < ribs; i++) {
      const x = i * ribW;
      const g = ctx.createLinearGradient(x, 0, x + ribW, 0);
      g.addColorStop(0, '#2a2f38');
      g.addColorStop(0.35, '#555d6b');
      g.addColorStop(0.55, '#687182');
      g.addColorStop(1, '#262b33');
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, ribW, size);

      const bg = bCtx.createLinearGradient(x, 0, x + ribW, 0);
      bg.addColorStop(0, '#404040');
      bg.addColorStop(0.5, '#e8e8e8');
      bg.addColorStop(1, '#404040');
      bCtx.fillStyle = bg;
      bCtx.fillRect(x, 0, ribW, size);
    }

    // Brushed metallic horizontal scratches
    for (let i = 0; i < 1200; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const w = 18 + rand() * 90;
      ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
      ctx.fillRect(x, y, w, 1.5);
    }

    // Center subtle target ring painted onto metal sheet
    const cx = size * 0.5;
    const cy = size * 0.52;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, 220, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 110, 0, Math.PI * 2);
    ctx.stroke();

    // Rivet rows
    for (let x = 32; x < size; x += 64) {
      for (const y of [28, size * 0.5, size - 28]) {
        ctx.fillStyle = '#7c8594';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = maxAnisotropy;
  map.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.anisotropy = maxAnisotropy;
  bumpMap.needsUpdate = true;

  return { map, bumpMap };
}

export function createWallImpactOverlay(maxAnisotropy: number): ImpactOverlayHandle {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;

  const stampImpact = (
    u: number,
    v: number,
    liquidHex: number,
    radiusPx: number,
    surface: WallStyle,
  ) => {
    const cx = Math.max(0, Math.min(width, u * width));
    const cy = Math.max(0, Math.min(height, (1 - v) * height));

    const r = (liquidHex >> 16) & 255;
    const g = (liquidHex >> 8) & 255;
    const b = liquidHex & 255;

    if (surface === 'glass_window') {
      // Dramatic spiderweb fracture cracks on tempered glass!
      const crackRadius = radiusPx * 1.65;

      // Frosted crushed white glass impact point
      const coreGrad = ctx.createRadialGradient(cx, cy, 1, cx, cy, radiusPx * 0.42);
      coreGrad.addColorStop(0, 'rgba(245, 252, 255, 0.92)');
      coreGrad.addColorStop(0.5, 'rgba(210, 236, 248, 0.55)');
      coreGrad.addColorStop(1, 'rgba(200, 230, 245, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radiusPx * 0.42, 0, Math.PI * 2);
      ctx.fill();

      // Radial jagged crack arms
      const arms = 13 + Math.floor(Math.random() * 5);
      const armAngles: number[] = [];
      for (let i = 0; i < arms; i++) {
        const ang = (i / arms) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
        armAngles.push(ang);
        const len = crackRadius * (0.55 + Math.random() * 0.65);
        ctx.strokeStyle = 'rgba(240, 250, 255, 0.82)';
        ctx.lineWidth = 1.1 + Math.random() * 1.4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const midX = cx + Math.cos(ang + 0.08) * (len * 0.52);
        const midY = cy + Math.sin(ang + 0.08) * (len * 0.52);
        const endX = cx + Math.cos(ang) * len;
        const endY = cy + Math.sin(ang) * len;
        ctx.lineTo(midX, midY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      // Concentric spiderweb rings
      for (const ringFrac of [0.28, 0.52, 0.78]) {
        ctx.strokeStyle = 'rgba(230, 246, 255, 0.5)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        for (let i = 0; i <= armAngles.length; i++) {
          const ang = armAngles[i % armAngles.length];
          const rr = crackRadius * ringFrac * (0.85 + Math.random() * 0.25);
          const px = cx + Math.cos(ang) * rr;
          const py = cy + Math.sin(ang) * rr;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // Subtle liquid streak
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.24)`;
      ctx.beginPath();
      ctx.arc(cx, cy, radiusPx * 0.45, 0, Math.PI * 2);
      ctx.fill();
    } else if (surface === 'metal') {
      // Metallic dent ring + bright steel scuff scratches + liquid splash
      const dentGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radiusPx * 0.65);
      dentGrad.addColorStop(0, 'rgba(15, 18, 22, 0.72)');
      dentGrad.addColorStop(0.6, 'rgba(40, 46, 54, 0.45)');
      dentGrad.addColorStop(0.85, 'rgba(220, 232, 245, 0.48)');
      dentGrad.addColorStop(1, 'rgba(220, 232, 245, 0)');
      ctx.fillStyle = dentGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radiusPx * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Bright scratched steel sparks
      for (let i = 0; i < 10; i++) {
        const ang = Math.random() * Math.PI * 2;
        const len = radiusPx * (0.4 + Math.random() * 0.75);
        ctx.strokeStyle = 'rgba(235, 242, 250, 0.58)';
        ctx.lineWidth = 1 + Math.random() * 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
        ctx.stroke();
      }

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.28)`;
      ctx.beginPath();
      ctx.arc(cx, cy, radiusPx * 0.55, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Brick / Concrete wet splash & masonry chip
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radiusPx);
      grad.addColorStop(
        0,
        `rgba(${Math.floor(r * 0.55)}, ${Math.floor(g * 0.55)}, ${Math.floor(b * 0.55)}, 0.55)`,
      );
      grad.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, 0.28)`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radiusPx, 0, Math.PI * 2);
      ctx.fill();

      const rays = 14;
      for (let i = 0; i < rays; i++) {
        const ang = (i / rays) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
        const len = radiusPx * (0.45 + Math.random() * 0.95);
        const ex = cx + Math.cos(ang) * len;
        const ey = cy + Math.sin(ang) * len;

        ctx.strokeStyle =
          i % 3 === 0 ? 'rgba(235, 240, 245, 0.36)' : `rgba(${r}, ${g}, ${b}, 0.38)`;
        ctx.lineWidth = 1.2 + Math.random() * 2.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        if (Math.random() > 0.35) {
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.42)`;
          ctx.beginPath();
          ctx.arc(ex, ey, 1.5 + Math.random() * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Pale concrete/mortar chip center
      ctx.fillStyle =
        surface === 'concrete' ? 'rgba(235, 232, 224, 0.52)' : 'rgba(215, 200, 185, 0.42)';
      ctx.beginPath();
      ctx.arc(cx, cy, 3 + Math.random() * 4.5, 0, Math.PI * 2);
      ctx.fill();

      const dripCount = 2 + Math.floor(Math.random() * 3);
      for (let d = 0; d < dripCount; d++) {
        const dx = cx + (Math.random() - 0.5) * radiusPx * 0.7;
        const dLen = radiusPx * (0.6 + Math.random() * 1.4);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.32)`;
        ctx.lineWidth = 1.5 + Math.random() * 2;
        ctx.beginPath();
        ctx.moveTo(dx, cy);
        ctx.lineTo(dx + (Math.random() - 0.5) * 3, Math.min(height, cy + dLen));
        ctx.stroke();
      }
    }

    texture.needsUpdate = true;
  };

  const clear = () => {
    ctx.clearRect(0, 0, width, height);
    texture.needsUpdate = true;
  };

  const dispose = () => {
    texture.dispose();
  };

  return { texture, stampImpact, clear, dispose };
}

export function createGroundTexture(
  location: EnvironmentLocation,
  maxAnisotropy: number,
): {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;

  const rand = seededRand(
    location === 'indoor' ? 777 : location === 'alley' ? 888 : 999,
  );

  if (location === 'indoor') {
    ctx.fillStyle = '#25282e';
    ctx.fillRect(0, 0, size, size);
    rCtx.fillStyle = '#b8b8b8';
    rCtx.fillRect(0, 0, size, size);

    for (let i = 0; i < 7000; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const sz = 1 + rand() * 5;
      const c = Math.floor(28 + rand() * 36);
      ctx.fillStyle = `rgba(${c},${c + 2},${c + 5},0.35)`;
      ctx.fillRect(x, y, sz, sz);
      const rv = Math.floor(140 + rand() * 90);
      rCtx.fillStyle = `rgba(${rv},${rv},${rv},0.25)`;
      rCtx.fillRect(x, y, sz, sz);
    }

    ctx.strokeStyle = 'rgba(12,14,18,0.65)';
    ctx.lineWidth = 4;
    for (let i = 1; i < 4; i++) {
      const p = (size / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(size, p);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, size);
      ctx.stroke();
    }

    const stripeY = 48;
    const stripeH = 34;
    ctx.fillStyle = '#d9a421';
    ctx.fillRect(0, stripeY, size, stripeH);
    ctx.fillStyle = '#181a1f';
    for (let x = -60; x < size + 60; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, stripeY);
      ctx.lineTo(x + 24, stripeY);
      ctx.lineTo(x + 6, stripeY + stripeH);
      ctx.lineTo(x - 18, stripeY + stripeH);
      ctx.closePath();
      ctx.fill();
    }
  } else if (location === 'alley') {
    // Weathered urban asphalt
    ctx.fillStyle = '#1d2026';
    ctx.fillRect(0, 0, size, size);
    rCtx.fillStyle = '#909090';
    rCtx.fillRect(0, 0, size, size);

    for (let i = 0; i < 9500; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const sz = 1 + rand() * 4;
      const c = Math.floor(18 + rand() * 42);
      ctx.fillStyle = `rgba(${c},${c + 2},${c + 6},0.4)`;
      ctx.fillRect(x, y, sz, sz);
    }

    // Center alley drainage seam & subtle dashed line
    ctx.fillStyle = 'rgba(220, 175, 55, 0.22)';
    for (let y = 30; y < size; y += 120) {
      ctx.fillRect(size * 0.5 - 6, y, 12, 65);
    }
  } else {
    // Construction site compacted gravel & dirt
    ctx.fillStyle = '#47423a';
    ctx.fillRect(0, 0, size, size);
    rCtx.fillStyle = '#d4d4d4';
    rCtx.fillRect(0, 0, size, size);

    for (let i = 0; i < 11000; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const sz = 2 + rand() * 6;
      const base = Math.floor(48 + rand() * 58);
      ctx.fillStyle = `rgba(${base + 10},${base + 4},${base - 6},0.48)`;
      ctx.fillRect(x, y, sz, sz);
    }
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(location === 'indoor' ? 3 : 6, location === 'indoor' ? 3 : 6);
  map.anisotropy = maxAnisotropy;
  map.needsUpdate = true;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(location === 'indoor' ? 3 : 6, location === 'indoor' ? 3 : 6);
  roughnessMap.anisotropy = maxAnisotropy;
  roughnessMap.needsUpdate = true;

  return { map, roughnessMap };
}

export function createWoodTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const rand = seededRand(404);

  ctx.fillStyle = '#6e4c30';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 420; i++) {
    const y = rand() * size;
    const h = 1 + rand() * 4;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(42,26,14,0.28)' : 'rgba(138,98,62,0.2)';
    ctx.fillRect(0, y, size, h);
  }

  ctx.strokeStyle = 'rgba(28,16,8,0.55)';
  ctx.lineWidth = 4;
  for (let p = 1; p < 4; p++) {
    const y = (size / 4) * p;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createBottleLabelTexture(
  spec: BottleSpec,
  stressTag: string,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = spec.labelBgHex;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = spec.labelTextHex;
  ctx.lineWidth = 8;
  ctx.strokeRect(14, 14, width - 28, height - 28);

  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, width - 48, height - 48);

  const rand = seededRand(909);
  for (let i = 0; i < 240; i++) {
    ctx.fillStyle = 'rgba(0,0,0,0.035)';
    ctx.fillRect(rand() * width, rand() * height, 2, 2);
  }

  ctx.fillStyle = spec.labelTextHex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const cleanTag = stressTag.trim();
  if (cleanTag.length > 0) {
    ctx.font = 'bold 20px monospace';
    ctx.globalAlpha = 0.68;
    ctx.fillText('SMASH TARGET', width / 2, 58);
    ctx.globalAlpha = 1;

    const upper = cleanTag.toUpperCase().slice(0, 14);
    const fontSize = upper.length > 10 ? 44 : upper.length > 7 ? 54 : 64;
    ctx.font = `900 ${fontSize}px system-ui, sans-serif`;
    ctx.fillText(upper, width / 2, 134);

    ctx.fillStyle = '#c83e37';
    ctx.fillRect(width * 0.22, 186, width * 0.56, 6);
  } else {
    ctx.font = 'bold 22px serif';
    ctx.globalAlpha = 0.72;
    ctx.fillText('VINTAGE RESERVE', width / 2, 64);
    ctx.globalAlpha = 1;

    ctx.font = '900 44px serif';
    ctx.fillText(spec.shortEn.toUpperCase(), width / 2, 128);

    ctx.font = 'bold 18px monospace';
    ctx.globalAlpha = 0.75;
    ctx.fillText(`${spec.massKg.toFixed(2)} KG · ${spec.fragility.toUpperCase()}`, width / 2, 186);
    ctx.globalAlpha = 1;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}
