import type { PlayerState } from './types';

export function drawPersianExplorer(
  ctx: CanvasRenderingContext2D,
  p: PlayerState,
  isActive: boolean,
  isPast: boolean,
  t: number
): void {
  const cx = p.x + p.w / 2;
  const footY = p.y + p.h;
  const airborne = !p.onGround;
  const speedRatio = Math.min(1, Math.abs(p.vx) / 275);
  const breath = Math.sin(t * 3.4) * 0.9;
  const interactRaise = p.interactAnim > 0 ? Math.sin((p.interactAnim / 0.35) * Math.PI) : 0;

  ctx.save();
  ctx.globalAlpha = isActive ? 1.0 : 0.44;

  // 1. Ground shadow & Persian astrolabe anchor ring
  if (p.onGround) {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.38)';
    ctx.beginPath();
    ctx.ellipse(cx, footY + 1, 15, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (isActive) {
    const ringColor = isPast ? '#fbbf24' : '#38bdf8';
    const pulse = 18 + Math.sin(t * 5) * 2;
    ctx.save();
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.ellipse(cx, footY + 2, pulse, 5.2, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Small cardinal rune ticks
    for (let i = 0; i < 4; i++) {
      const a = t * 1.4 + (i * Math.PI) / 2;
      const rx = cx + Math.cos(a) * pulse;
      const ry = footY + 2 + Math.sin(a) * 5.2;
      ctx.fillStyle = ringColor;
      ctx.beginPath();
      ctx.arc(rx, ry, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Transform to local hero coordinates (0,0 = feet, +x = facing forward, -y = up)
  ctx.translate(cx, footY);
  ctx.scale(p.facing * p.scaleX * 1.18, p.scaleY * 1.18);

  // Subtle forward athletic lean while running
  const lean = speedRatio * 0.12 + (airborne ? (p.vy < 0 ? -0.06 : 0.08) : 0);
  ctx.rotate(lean);

  // Palette shifts cleanly between Living 2089 and Echo 2189
  const palette = isPast
    ? {
        skin: '#e2ae86',
        skinShade: '#c48b63',
        hair: '#1e1614',
        tunic: '#0f5132',
        tunicLight: '#15803d',
        trousers: '#f3ead8',
        trousersShade: '#d6c8b0',
        scarf: '#be123c',
        scarfTrim: '#fbbf24',
        boot: '#451a03',
        gold: '#f59e0b',
        goldBright: '#fde047',
        gem: '#34d399',
        blade: '#e2e8f0'
      }
    : {
        skin: '#cbd5e1',
        skinShade: '#94a3b8',
        hair: '#0f172a',
        tunic: '#1e293b',
        tunicLight: '#0369a1',
        trousers: '#bae6fd',
        trousersShade: '#7dd3fc',
        scarf: '#0284c7',
        scarfTrim: '#7dd3fc',
        boot: '#0f172a',
        gold: '#38bdf8',
        goldBright: '#bae6fd',
        gem: '#22d3ee',
        blade: '#7dd3fc'
      };

  // Stride angles
  const stride = Math.sin(p.walkCycle) * speedRatio;
  const backLegAngle = airborne ? (p.vy < 0 ? 0.55 : 0.28) : -stride * 0.65;
  const frontLegAngle = airborne ? (p.vy < 0 ? -0.78 : -0.35) : stride * 0.65;
  const backArmAngle = airborne ? -0.9 : stride * 0.6;
  const frontArmAngle =
    interactRaise > 0 ? -1.45 * interactRaise : airborne ? -1.25 : -stride * 0.65;

  // 2. FLOWING SILK SCARF & VEIL RIBBON (behind body, velocity-driven wave)
  const windDrag = 10 + speedRatio * 18 + Math.min(10, Math.abs(p.vy) * 0.015);
  const wave1 = Math.sin(p.scarfPhase) * (3 + speedRatio * 4);
  const wave2 = Math.sin(p.scarfPhase - 1.5) * (4.5 + speedRatio * 5);
  const liftY = airborne ? p.vy * 0.025 : 0;

  // Long billowing crimson/cyan silk scarf
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-2, -33 + breath);
  ctx.bezierCurveTo(
    -10 - windDrag * 0.4,
    -35 + wave1 - liftY * 0.4,
    -18 - windDrag * 0.85,
    -26 + wave2 - liftY,
    -26 - windDrag,
    -21 + wave2 * 1.2 - liftY * 1.1
  );
  ctx.lineTo(-24 - windDrag * 0.92, -14 + wave2 * 1.15 - liftY);
  ctx.bezierCurveTo(
    -16 - windDrag * 0.7,
    -19 + wave1 * 0.8 - liftY * 0.7,
    -9 - windDrag * 0.35,
    -27 + wave1 * 0.5,
    -2,
    -26 + breath
  );
  ctx.closePath();
  ctx.fillStyle = palette.scarf;
  ctx.fill();

  // Gold embroidered scarf edge
  ctx.strokeStyle = palette.scarfTrim;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-2, -33 + breath);
  ctx.bezierCurveTo(
    -10 - windDrag * 0.4,
    -35 + wave1 - liftY * 0.4,
    -18 - windDrag * 0.85,
    -26 + wave2 - liftY,
    -26 - windDrag,
    -21 + wave2 * 1.2 - liftY * 1.1
  );
  ctx.stroke();

  // Flowing dark braided hair / veil tail
  ctx.strokeStyle = palette.hair;
  ctx.lineWidth = 4.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, -39 + breath);
  ctx.quadraticCurveTo(
    -12 - windDrag * 0.35,
    -38 + wave1 * 0.6,
    -16 - windDrag * 0.55,
    -29 + wave2 * 0.7 - liftY * 0.5
  );
  ctx.stroke();
  ctx.restore();

  // Helper to draw articulated leg (billowing sirwal trousers + wrapped leather boot)
  const drawLeg = (angle: number, isBack: boolean) => {
    ctx.save();
    ctx.translate(isBack ? -2 : 2, -18 + breath * 0.3);
    ctx.rotate(angle);

    // Billowing harem trouser thigh
    ctx.fillStyle = isBack ? palette.trousersShade : palette.trousers;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.quadraticCurveTo(-6.5, 6, -3.5, 11);
    ctx.lineTo(3.5, 11);
    ctx.quadraticCurveTo(6.5, 6, 4, 0);
    ctx.closePath();
    ctx.fill();

    // Knee bend
    const kneeBend = airborne ? (p.vy < 0 ? 0.65 : 0.25) : Math.max(0, -angle * 0.45);
    ctx.translate(0, 10);
    ctx.rotate(kneeBend);

    // Wrapped leather greave / boot
    ctx.fillStyle = palette.boot;
    ctx.beginPath();
    ctx.roundRect(-3.2, 0, 6.4, 9, 2);
    ctx.fill();

    // Upturned Persian boot toe & gold cuff
    ctx.beginPath();
    ctx.moveTo(-3.2, 7.5);
    ctx.lineTo(5.8, 7.8);
    ctx.quadraticCurveTo(7.2, 6.8, 5.5, 5.4);
    ctx.lineTo(2.5, 5.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = palette.gold;
    ctx.fillRect(-3.4, 0.5, 6.8, 1.8);
    ctx.restore();
  };

  // Helper to draw articulated arm with gold bracer
  const drawArm = (angle: number, isBack: boolean, holdDagger: boolean) => {
    ctx.save();
    ctx.translate(isBack ? -3 : 3, -32 + breath);
    ctx.rotate(angle);

    // Upper sleeve / shoulder guard
    ctx.fillStyle = isBack ? palette.tunic : palette.tunicLight;
    ctx.beginPath();
    ctx.arc(0, 1, 3.6, 0, Math.PI * 2);
    ctx.fill();

    // Forearm
    ctx.fillStyle = isBack ? palette.skinShade : palette.skin;
    ctx.beginPath();
    ctx.roundRect(-2.2, 2, 4.4, 11, 2);
    ctx.fill();

    // Gold Persian bracer
    ctx.fillStyle = palette.gold;
    ctx.fillRect(-2.6, 6.5, 5.2, 4.8);
    ctx.fillStyle = palette.goldBright;
    ctx.fillRect(-2.6, 6.5, 5.2, 1.2);

    // Hand
    ctx.fillStyle = isBack ? palette.skinShade : palette.skin;
    ctx.beginPath();
    ctx.arc(0, 13.8, 2.3, 0, Math.PI * 2);
    ctx.fill();

    // Dagger of Time / Scimitar flash when interacting
    if (holdDagger && interactRaise > 0.1) {
      ctx.save();
      ctx.translate(1, 14);
      ctx.rotate(-0.4);
      ctx.fillStyle = palette.gold;
      ctx.fillRect(-1.5, -2, 3, 4);
      ctx.fillStyle = palette.blade;
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.quadraticCurveTo(5, 11, 2, 19);
      ctx.quadraticCurveTo(0, 11, -1.5, 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  };

  // 3. BACK LIMBS
  drawArm(backArmAngle, true, false);
  drawLeg(backLegAngle, true);

  // 4. TORSO: ORNATE PERSIAN VEST, WAIST SASH & SCIMITAR
  ctx.save();
  ctx.translate(0, breath);

  // Tunic body
  ctx.fillStyle = palette.tunic;
  ctx.beginPath();
  ctx.moveTo(-6.5, -34);
  ctx.lineTo(7, -34);
  ctx.lineTo(5.5, -18);
  ctx.lineTo(-5.5, -18);
  ctx.closePath();
  ctx.fill();

  // Gold embroidered V-trim on vest
  ctx.strokeStyle = palette.goldBright;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-3.5, -34);
  ctx.lineTo(1, -24);
  ctx.lineTo(4.5, -34);
  ctx.stroke();

  // Crimson royal waist sash + fluttering side-tail
  ctx.fillStyle = palette.scarf;
  ctx.fillRect(-6, -21.5, 12, 4.2);
  ctx.fillStyle = palette.goldBright;
  ctx.fillRect(0.5, -21.2, 3.2, 3.5); // Brass buckle

  ctx.fillStyle = palette.scarf;
  ctx.beginPath();
  ctx.moveTo(-5, -18);
  ctx.lineTo(-9 - windDrag * 0.25, -10 + wave1 * 0.4);
  ctx.lineTo(-4 - windDrag * 0.15, -9 + wave1 * 0.3);
  ctx.lineTo(-2, -18);
  ctx.closePath();
  ctx.fill();

  // Curved Persian Scimitar sheathed at the hip
  ctx.save();
  ctx.translate(-3, -19.5);
  ctx.rotate(0.45 - speedRatio * 0.12);
  // Hilt & crescent crossguard
  ctx.fillStyle = palette.goldBright;
  ctx.fillRect(3.5, -2, 4.5, 2);
  ctx.fillRect(2.5, -3.5, 1.5, 5);
  // Curved scabbard / blade silhouette
  ctx.fillStyle = isPast ? '#334155' : '#0ea5e9';
  ctx.beginPath();
  ctx.moveTo(2.5, -1.2);
  ctx.quadraticCurveTo(-7, 2.5, -14, -1.5);
  ctx.quadraticCurveTo(-6, 4.6, 2.5, 1.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = palette.gold;
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.restore();

  // Glowing Chrono Core Amulet on chest
  if (isActive) {
    ctx.fillStyle = isPast ? 'rgba(253, 224, 71, 0.32)' : 'rgba(56, 189, 248, 0.35)';
    ctx.beginPath();
    ctx.arc(2, -26.5, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = palette.gem;
  ctx.beginPath();
  ctx.moveTo(2, -29.5);
  ctx.lineTo(4.5, -26.5);
  ctx.lineTo(2, -23.5);
  ctx.lineTo(-0.5, -26.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 5. FRONT LEG
  drawLeg(frontLegAngle, false);

  // 6. HEAD, EXPRESSIVE PROFILE & GOLDEN DIADEM
  ctx.save();
  ctx.translate(1, -40.5 + breath * 1.1);

  // Neck
  ctx.fillStyle = palette.skinShade;
  ctx.fillRect(-2.5, 3, 5, 4.5);

  // Face / Head
  ctx.fillStyle = palette.skin;
  ctx.beginPath();
  ctx.arc(0, 0, 6.8, 0, Math.PI * 2);
  ctx.fill();

  // Hair crown & bangs sweeping back
  ctx.fillStyle = palette.hair;
  ctx.beginPath();
  ctx.arc(-1, -1.4, 7.1, Math.PI * 0.72, Math.PI * 2.02);
  ctx.quadraticCurveTo(3.5, -4, -3, -1);
  ctx.closePath();
  ctx.fill();

  // Crisp expressive eye & brow
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(2.4, -1.2, 2.6, 1.4);
  ctx.fillStyle = isPast ? '#ffffff' : '#bae6fd';
  ctx.fillRect(3.6, -0.9, 1.1, 1.1);

  // Golden Persian Diadem / Circlet + Forehead Gem
  ctx.strokeStyle = palette.goldBright;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6.2, -2.5);
  ctx.quadraticCurveTo(0, -4.6, 6.2, -2.5);
  ctx.stroke();

  ctx.fillStyle = palette.gem;
  ctx.beginPath();
  ctx.arc(4.8, -3.1, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 7. FRONT ARM (drawn over torso)
  drawArm(frontArmAngle, false, true);

  ctx.restore();
}
