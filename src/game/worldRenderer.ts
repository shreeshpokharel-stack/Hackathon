import { drawPersianExplorer } from './characterRenderer';
import { HALF_W, LOGICAL_H, LOGICAL_W, type Interactable, type LevelData, type PlayerState, type Rect, type Timeline } from './types';

export interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  r: number;
  timeline: Timeline | 'both';
}

export class ParticlePool {
  private readonly items: PooledParticle[];
  private cursor = 0;

  constructor(capacity = 180) {
    this.items = Array.from({ length: capacity }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      color: '#fbbf24',
      r: 3,
      timeline: 'both'
    }));
  }

  clear(): void {
    for (const p of this.items) p.active = false;
  }

  spawn(x: number, y: number, color: string, count = 16, timeline: Timeline | 'both' = 'both'): void {
    for (let i = 0; i < count; i++) {
      const slot = this.items[this.cursor];
      this.cursor = (this.cursor + 1) % this.items.length;
      const ang = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 170;
      const life = 0.45 + Math.random() * 0.55;
      slot.active = true;
      slot.x = x;
      slot.y = y;
      slot.vx = Math.cos(ang) * spd;
      slot.vy = Math.sin(ang) * spd - 42;
      slot.life = life;
      slot.maxLife = life;
      slot.color = color;
      slot.r = 2 + Math.random() * 3.2;
      slot.timeline = timeline;
    }
  }

  update(dt: number): void {
    for (const pt of this.items) {
      if (!pt.active) continue;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 260 * dt;
      pt.life -= dt;
      if (pt.life <= 0) pt.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D, timeline: Timeline): void {
    for (const pt of this.items) {
      if (!pt.active) continue;
      if (pt.timeline !== 'both' && pt.timeline !== timeline) continue;
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

export interface AmbientMote {
  x: number;
  y: number;
  r: number;
  speed: number;
  phase: number;
}

export function createAmbientMotes(count: number, minSpeed: number, maxSpeed: number): AmbientMote[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * 2000,
    y: Math.random() * 520,
    r: 1.5 + Math.random() * 2.4,
    speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
    phase: Math.random() * Math.PI * 2
  }));
}

export interface RenderContextState {
  level: LevelData;
  player: PlayerState;
  anchor: Timeline;
  freezeTimer: number;
  shiftFlash: number;
  shakeTimer: number;
  particles: ParticlePool;
  ambientPast: AmbientMote[];
  ambientFuture: AmbientMote[];
  isTitleTour: boolean;
}

export function renderSplitWorld(ctx: CanvasRenderingContext2D, state: RenderContextState, timeMs: number): void {
  const t = timeMs * 0.001;
  const { level: lv, player: p } = state;

  ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);

  const shakeX = state.shakeTimer > 0 ? (Math.random() - 0.5) * 9 : 0;
  const shakeY = state.shakeTimer > 0 ? (Math.random() - 0.5) * 9 : 0;

  const camX = state.isTitleTour
    ? 60 + Math.sin(t * 0.25) * 55 + 55
    : Math.max(0, Math.min(lv.worldWidth - HALF_W, p.x - HALF_W / 2 + p.w / 2));

  renderViewport(ctx, state, 'past', 0, HALF_W, camX + shakeX, shakeY, t);
  renderViewport(ctx, state, 'future', HALF_W, HALF_W, camX + shakeX, shakeY, t);

  // Glowing temporal divider seam
  const divGrad = ctx.createLinearGradient(HALF_W - 14, 0, HALF_W + 14, 0);
  divGrad.addColorStop(0, 'rgba(74, 222, 128, 0)');
  divGrad.addColorStop(
    0.5,
    state.anchor === 'past' ? 'rgba(251, 191, 36, 0.78)' : 'rgba(56, 189, 248, 0.85)'
  );
  divGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = divGrad;
  ctx.fillRect(HALF_W - 14, 0, 28, LOGICAL_H);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(HALF_W, 0);
  ctx.lineTo(HALF_W, LOGICAL_H);
  ctx.stroke();

  if (!state.isTitleTour) {
    // Crisp top-of-viewport era labels beside the temporal divider (clear of corner HUD cards)
    ctx.save();
    ctx.font = '600 11px "Cinzel", Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillText('PAST · 2089', HALF_W - 124, 27);
    ctx.fillStyle = state.anchor === 'past' ? '#fef08a' : 'rgba(241, 245, 249, 0.72)';
    ctx.fillText('PAST · 2089', HALF_W - 125, 26);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillText('FUTURE · 2189', HALF_W + 126, 27);
    ctx.fillStyle = state.anchor === 'future' ? '#7dd3fc' : 'rgba(241, 245, 249, 0.72)';
    ctx.fillText('FUTURE · 2189', HALF_W + 125, 26);
    ctx.restore();
  }

  if (state.shiftFlash > 0) {
    ctx.fillStyle =
      state.anchor === 'future'
        ? `rgba(56, 189, 248, ${state.shiftFlash * 0.22})`
        : `rgba(251, 191, 36, ${state.shiftFlash * 0.2})`;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  }
}

function renderViewport(
  ctx: CanvasRenderingContext2D,
  state: RenderContextState,
  timeline: Timeline,
  viewX: number,
  viewW: number,
  camX: number,
  shakeY: number,
  t: number
): void {
  const lv = state.level;
  const isPast = timeline === 'past';
  const isActive = state.anchor === timeline;
  const bfly = lv.state.butterfly;

  ctx.save();
  ctx.beginPath();
  ctx.rect(viewX, 0, viewW, LOGICAL_H);
  ctx.clip();

  // 1. Atmospheric Sky Gradient
  const sky = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
  if (isPast) {
    sky.addColorStop(0, '#0c4a6e');
    sky.addColorStop(0.55, '#0284c7');
    sky.addColorStop(0.88, '#fde68a');
    sky.addColorStop(1, '#fef3c7');
  } else if (bfly) {
    sky.addColorStop(0, '#0f172a');
    sky.addColorStop(0.5, '#1e1b4b');
    sky.addColorStop(1, '#312e81');
  } else {
    sky.addColorStop(0, '#070b14');
    sky.addColorStop(0.62, '#171530');
    sky.addColorStop(1, '#3b1510');
  }
  ctx.fillStyle = sky;
  ctx.fillRect(viewX, 0, viewW, LOGICAL_H);

  // Sun / Future Eclipse
  if (isPast) {
    ctx.fillStyle = 'rgba(253, 224, 71, 0.24)';
    ctx.beginPath();
    ctx.arc(viewX + 490, 128, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(viewX + 490, 128, 34, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = bfly ? 'rgba(56, 189, 248, 0.24)' : 'rgba(251, 146, 60, 0.22)';
    ctx.beginPath();
    ctx.arc(viewX + 150, 130, 56, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#070b14';
    ctx.beginPath();
    ctx.arc(viewX + 150, 130, 38, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Parallax Architectural Silhouettes (Persian Domes & Arches vs Brutalist Towers)
  for (let i = 0; i < 9; i++) {
    const px = viewX + (((i * 230 - camX * 0.25) % 2100 + 2100) % 2100) - 120;
    if (isPast) {
      // Rolling emerald-olive desert ridges
      ctx.fillStyle = 'rgba(13, 74, 52, 0.36)';
      ctx.beginPath();
      ctx.moveTo(px - 90, 580);
      ctx.quadraticCurveTo(px + 60, 355 + (i % 3) * 28, px + 210, 580);
      ctx.closePath();
      ctx.fill();

      // Distant Persian sandstone pavilion with onion dome & pointed arch
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(92, 45, 22, 0.34)';
        ctx.fillRect(px + 20, 445, 82, 135);
        ctx.beginPath();
        ctx.arc(px + 61, 445, 30, Math.PI, 0);
        ctx.fill();
        // Spire finial
        ctx.fillRect(px + 59, 400, 4, 18);
        // Arch cutout silhouette
        ctx.fillStyle = 'rgba(253, 230, 138, 0.14)';
        ctx.beginPath();
        ctx.arc(px + 61, 505, 16, Math.PI, 0);
        ctx.lineTo(px + 77, 580);
        ctx.lineTo(px + 45, 580);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
      const bh = 180 + (i % 4) * 55;
      ctx.fillRect(px, 580 - bh, 86, bh);
      ctx.fillStyle = bfly ? 'rgba(52, 211, 153, 0.28)' : 'rgba(251, 146, 60, 0.2)';
      ctx.fillRect(px + 14, 580 - bh + 22, 10, 12);
      ctx.fillRect(px + 50, 580 - bh + 44, 10, 12);
    }
  }

  // World Space
  ctx.save();
  ctx.translate(viewX - camX, shakeY);

  // 3. Butterfly Effect Visuals in Future
  if (!isPast && bfly) {
    for (let i = 0; i < 14; i++) {
      const bx = 140 + i * 130 + Math.sin(t * 2 + i) * 28;
      const by = 430 + Math.cos(t * 3 + i * 1.4) * 30;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(bx - 4, by, 5, 3, Math.sin(t * 14), 0, Math.PI * 2);
      ctx.ellipse(bx + 4, by, 5, 3, -Math.sin(t * 14), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. Platforms (Sandstone Masonry in Past, Steel Monoliths in Future)
  const basePlatforms = isPast ? lv.pastPlatforms : lv.futurePlatforms;
  for (const pl of basePlatforms) {
    drawPlatform(ctx, pl, isPast, bfly);
  }

  // Dynamic Platforms
  for (const dp of lv.dynamicPlatforms) {
    if (dp.timeline === timeline && dp.active) {
      ctx.save();
      const scale = dp.growAnim;
      const drawW = dp.w * scale;
      const drawX = dp.x + (dp.w - drawW) / 2;
      if (dp.kind === 'tree' || dp.kind === 'crystalTree') {
        ctx.fillStyle = dp.kind === 'crystalTree' ? '#0284c7' : '#78350f';
        ctx.fillRect(dp.x + dp.w / 2 - 12, dp.y + 12, 24, 220 * scale);
        ctx.fillStyle = dp.kind === 'crystalTree' ? '#38bdf8' : '#22c55e';
        ctx.fillRect(drawX, dp.y, drawW, dp.h);
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.fillRect(drawX, dp.y, drawW, 4);
      } else {
        drawPlatform(ctx, dp, isPast, bfly);
      }
      ctx.restore();
    }
  }

  // Barriers
  for (const br of lv.barriers) {
    if (br.timeline === timeline && br.active) {
      if (br.kind === 'stoneGate') {
        ctx.fillStyle = '#57534e';
        ctx.fillRect(br.x, br.y, br.w, br.h);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.strokeRect(br.x + 4, br.y + 4, br.w - 8, br.h - 8);
      } else if (br.kind === 'energyShield') {
        ctx.fillStyle = 'rgba(168, 85, 247, 0.34)';
        ctx.fillRect(br.x, br.y, br.w, br.h);
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.strokeRect(br.x, br.y, br.w, br.h);
      } else {
        ctx.fillStyle = '#334155';
        ctx.fillRect(br.x, br.y, br.w, br.h);
      }
    }
  }

  // Elevators
  for (const el of lv.elevators) {
    if (el.timeline === timeline) {
      ctx.fillStyle = el.active ? '#0ea5e9' : '#475569';
      ctx.fillRect(el.x, el.y, el.w, el.h);
      if (el.active) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.36)';
        ctx.fillRect(el.x + 8, el.y + el.h, el.w - 16, 10);
      }
    }
  }

  // Hazards (Chrono-Sentinel Drones with sensor sweep)
  for (const hz of lv.hazards) {
    if (hz.timeline === timeline) {
      const frozen = state.freezeTimer > 0;
      ctx.save();
      if (!frozen) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.14)';
        ctx.beginPath();
        ctx.moveTo(hz.x + hz.w / 2, hz.y + hz.h / 2);
        ctx.lineTo(hz.x + hz.w / 2 + (hz.vx >= 0 ? 55 : -55), hz.y + hz.h + 18);
        ctx.lineTo(hz.x + hz.w / 2 + (hz.vx >= 0 ? 20 : -20), hz.y + hz.h + 18);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = frozen ? '#38bdf8' : '#dc2626';
      ctx.beginPath();
      ctx.roundRect(hz.x, hz.y, hz.w, hz.h, 8);
      ctx.fill();
      ctx.fillStyle = '#fef2f2';
      ctx.fillRect(hz.x + 8, hz.y + 9, hz.w - 16, 6);
      if (frozen) {
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 2;
        ctx.strokeRect(hz.x - 3, hz.y - 3, hz.w + 6, hz.h + 6);
      }
      ctx.restore();
    }
  }

  // Interactables
  for (const obj of lv.interactables) {
    if (obj.timeline === timeline) {
      drawInteractable(ctx, obj, state.player, t, isActive && !state.isTitleTour);
    }
  }

  // Chrono Fragments
  for (const frag of lv.fragments) {
    if (!frag.collected && frag.timeline === timeline) {
      const fy = frag.y + Math.sin(t * 4) * 6;
      ctx.save();
      ctx.translate(frag.x, fy);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(t * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-8, -8, 16, 16);
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-5, -5, 10, 10);
      ctx.restore();
    }
  }

  // Exit Portal (Persian Archway Gate)
  if (lv.portal.timeline === timeline) {
    const pt = lv.portal;
    ctx.save();
    ctx.translate(pt.x, pt.y + 45);
    const glow = isPast ? '#4ade80' : '#c084fc';
    ctx.strokeStyle = isPast ? 'rgba(74, 222, 128, 0.28)' : 'rgba(192, 132, 252, 0.28)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.ellipse(0, 0, 29, 47, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = glow;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 44, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = isPast ? 'rgba(74, 222, 128, 0.22)' : 'rgba(192, 132, 252, 0.25)';
    ctx.fill();
    ctx.restore();
  }

  // Princess / Prince of Persia Explorer & Temporal Echo
  drawPersianExplorer(ctx, state.player, isActive, isPast, t);

  // Pooled Action Particles
  state.particles.draw(ctx, timeline);

  ctx.restore(); // Exit world transform

  // Ambient Drifting Motes
  const amb = isPast ? state.ambientPast : state.ambientFuture;
  for (const a of amb) {
    const ax = viewX + (((a.x - camX * 0.6 + t * a.speed) % viewW + viewW) % viewW);
    const ay = a.y + Math.sin(t * 2 + a.phase) * 14;
    ctx.fillStyle = isPast
      ? 'rgba(254, 240, 138, 0.65)'
      : bfly
        ? 'rgba(74, 222, 128, 0.65)'
        : 'rgba(251, 146, 60, 0.48)';
    ctx.beginPath();
    ctx.arc(ax, ay, a.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Inactive dimming + subtle active edge indicator
  if (!isActive && !state.isTitleTour) {
    ctx.fillStyle = 'rgba(4, 7, 15, 0.26)';
    ctx.fillRect(viewX, 0, viewW, LOGICAL_H);
  } else if (!state.isTitleTour) {
    ctx.strokeStyle = isPast ? 'rgba(251, 191, 36, 0.55)' : 'rgba(56, 189, 248, 0.65)';
    ctx.lineWidth = 3;
    ctx.strokeRect(viewX + 1.5, 1.5, viewW - 3, LOGICAL_H - 3);
  }

  ctx.restore();
}

function drawPlatform(ctx: CanvasRenderingContext2D, pl: Rect, isPast: boolean, bfly: boolean): void {
  if (isPast) {
    ctx.fillStyle = '#4a3525';
    ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
    // Sandstone trim & carved block lines
    ctx.fillStyle = '#8b6544';
    ctx.fillRect(pl.x, pl.y + 8, pl.w, 8);
    ctx.fillStyle = 'rgba(28, 16, 8, 0.35)';
    for (let bx = pl.x + 36; bx < pl.x + pl.w; bx += 48) {
      ctx.fillRect(bx, pl.y + 8, 2, 8);
    }
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(pl.x, pl.y, pl.w, 8);
  } else {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
    ctx.fillStyle = bfly ? '#34d399' : '#475569';
    ctx.fillRect(pl.x, pl.y, pl.w, 6);
  }
}

function drawInteractable(
  ctx: CanvasRenderingContext2D,
  obj: Interactable,
  p: PlayerState,
  t: number,
  isActive: boolean
): void {
  const dist = Math.hypot(p.x + p.w / 2 - obj.x, p.y + p.h / 2 - obj.y);
  const bob = Math.sin(t * 4) * 3;

  ctx.save();
  if (obj.kind === 'butterfly') {
    const color = obj.done ? '#4ade80' : '#fbbf24';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(obj.x, obj.y + bob, 11, 0, Math.PI * 2);
    ctx.fill();
    // Stylized butterfly wings in canvas (no raw emoji font quirks)
    const wingSpan = 6 + Math.sin(t * 10) * 2;
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(obj.x - 4, obj.y + bob, wingSpan, 4, -0.3, 0, Math.PI * 2);
    ctx.ellipse(obj.x + 4, obj.y + bob, wingSpan, 4, 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (obj.kind === 'seed') {
    if (!obj.done) {
      ctx.fillStyle = 'rgba(74, 222, 128, 0.26)';
      ctx.beginPath();
      ctx.arc(obj.x, obj.y + bob, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.ellipse(obj.x, obj.y + bob, 9, 13, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (obj.kind === 'soil') {
    ctx.fillStyle = obj.done ? '#15803d' : '#78350f';
    ctx.fillRect(obj.x - 22, obj.y + 18, 44, 16);
    if (!obj.done) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(obj.x - 22, obj.y + 18, 44, 16);
    }
  } else if (obj.kind === 'conduit' || obj.kind === 'generator') {
    ctx.fillStyle = obj.done ? '#38bdf8' : '#ea580c';
    ctx.fillRect(obj.x - 16, obj.y - 10, 32, 46);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(obj.x - 8, obj.y, 16, 12);
  } else if (obj.kind === 'pillar') {
    ctx.fillStyle = obj.done ? '#475569' : '#d97706';
    ctx.fillRect(obj.x - 14, obj.y - 24, 28, 72);
  }

  if (!obj.done && isActive && dist < 72) {
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    const w = ctx.measureText(obj.label).width + 22;
    ctx.fillStyle = 'rgba(7, 11, 20, 0.92)';
    ctx.beginPath();
    ctx.roundRect(obj.x - w / 2, obj.y - 54, w, 24, 6);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'center';
    ctx.fillText(obj.label, obj.x, obj.y - 38);
  }
  ctx.restore();
}
