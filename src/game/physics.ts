import {
  GRAVITY,
  JUMP_VEL,
  LOGICAL_H,
  MOVE_SPEED,
  type Interactable,
  type LevelData,
  type PlayerState,
  type Rect,
  type Timeline
} from './types';

export function aabb(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function createInitialPlayer(spawn: { x: number; y: number }): PlayerState {
  return {
    x: spawn.x,
    y: spawn.y,
    w: 30,
    h: 46,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: false,
    coyote: 0,
    jumpBuffer: 0,
    walkCycle: 0,
    interactAnim: 0,
    scaleX: 1,
    scaleY: 1,
    scarfPhase: 0
  };
}

export function getActiveSolids(level: LevelData, timeline: Timeline): Rect[] {
  const list: Rect[] = timeline === 'past' ? [...level.pastPlatforms] : [...level.futurePlatforms];
  for (const dp of level.dynamicPlatforms) {
    if (dp.timeline === timeline && dp.active) list.push(dp);
  }
  for (const br of level.barriers) {
    if (br.timeline === timeline && br.active) list.push(br);
  }
  for (const el of level.elevators) {
    if (el.timeline === timeline) list.push(el);
  }
  return list;
}

export interface ChronoShiftResult {
  ok: boolean;
  targetAnchor: Timeline;
  newEnergy: number;
  liftY: number | null;
  reason?: 'low_energy' | 'obstructed';
}

export function computeChronoShift(
  level: LevelData,
  player: PlayerState,
  anchor: Timeline,
  energy: number
): ChronoShiftResult {
  const target: Timeline = anchor === 'past' ? 'future' : 'past';
  if (energy < 8) {
    return { ok: false, targetAnchor: anchor, newEnergy: energy, liftY: null, reason: 'low_energy' };
  }

  const solids = getActiveSolids(level, target);
  let blocked = false;
  let liftY: number | null = null;

  for (const s of solids) {
    if (aabb(player, s)) {
      const overlapDepth = player.y + player.h - s.y;
      if (overlapDepth > 0 && overlapDepth <= 90 && s.h <= 160) {
        const testBox: Rect = { x: player.x, y: s.y - player.h, w: player.w, h: player.h };
        if (!solids.some((other) => other !== s && aabb(testBox, other))) {
          liftY = s.y - player.h;
        } else {
          blocked = true;
        }
      } else {
        blocked = true;
      }
    }
  }

  if (blocked) {
    return { ok: false, targetAnchor: anchor, newEnergy: energy, liftY: null, reason: 'obstructed' };
  }

  return {
    ok: true,
    targetAnchor: target,
    newEnergy: Math.max(0, energy - 8),
    liftY
  };
}

export interface InteractionOutcome {
  executed: boolean;
  scoreDelta: number;
  energyDelta: number;
  toast: string;
  particleColor: string;
  particleX: number;
  particleY: number;
  particleCount: number;
  particleTimeline: Timeline | 'both';
  shake: number;
}

export function findNearestInteractable(
  level: LevelData,
  player: PlayerState,
  anchor: Timeline,
  maxDist = 62
): Interactable | null {
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;
  for (const obj of level.interactables) {
    if (obj.done || obj.timeline !== anchor) continue;
    const dist = Math.hypot(px - obj.x, py - obj.y);
    if (dist < maxDist) return obj;
  }
  return null;
}

export function applyInteraction(level: LevelData, obj: Interactable): InteractionOutcome {
  if (obj.kind === 'butterfly') {
    obj.done = true;
    level.state.butterfly = true;
    return {
      executed: true,
      scoreDelta: 300,
      energyDelta: 25,
      toast: 'Butterfly Effect: You healed 2189’s ecosystem (+300 pts)',
      particleColor: '#fbbf24',
      particleX: obj.x,
      particleY: obj.y,
      particleCount: 26,
      particleTimeline: 'both',
      shake: 0
    };
  }

  if (obj.kind === 'seed') {
    obj.done = true;
    level.state.hasSeed = true;
    level.objective = 'Plant the Seed in the Fertile Soil, then press [Q] to cross in FUTURE.';
    return {
      executed: true,
      scoreDelta: 100,
      energyDelta: 0,
      toast: 'Seed collected! Bring it to the fertile Soil.',
      particleColor: '#4ade80',
      particleX: obj.x,
      particleY: obj.y,
      particleCount: 20,
      particleTimeline: 'both',
      shake: 0
    };
  }

  if (obj.kind === 'soil') {
    if (!level.state.hasSeed) {
      return {
        executed: false,
        scoreDelta: 0,
        energyDelta: 0,
        toast: 'Find an Ancient Seed first!',
        particleColor: '#fbbf24',
        particleX: obj.x,
        particleY: obj.y,
        particleCount: 0,
        particleTimeline: 'both',
        shake: 0
      };
    }
    obj.done = true;
    level.state.hasSeed = false;
    level.state.treeGrown = true;
    for (const dp of level.dynamicPlatforms) {
      if (dp.kind === 'tree' || dp.kind === 'crystalTree') dp.active = true;
    }
    level.objective =
      level.num === 1
        ? 'Press [Q] to shift to FUTURE and cross the Giant Tree!'
        : 'Shift [Q] to FUTURE, cross the Crystal Tree, and activate Relay Alpha!';
    return {
      executed: true,
      scoreDelta: 250,
      energyDelta: 0,
      toast: 'Future Changed: A Giant Tree grew across the chasm!',
      particleColor: '#4ade80',
      particleX: obj.x,
      particleY: obj.y,
      particleCount: 26,
      particleTimeline: 'both',
      shake: 0.28
    };
  }

  if (obj.kind === 'conduit') {
    obj.done = true;
    let toast = 'Timeline conduit activated!';
    if (obj.id === 'conduit1') {
      const gate = level.barriers.find((b) => b.id === 'past_gate_1');
      if (gate) gate.active = false;
      level.state.gateOpened = true;
      level.objective = 'Shift [Q] back to PAST and enter the Ancient Portal!';
      toast = 'Past Changed: Ancient Stone Gate unlocked in 2089!';
    } else if (obj.id === 'relay3') {
      const vault = level.barriers.find((b) => b.id === 'vault3');
      if (vault) vault.active = false;
      level.objective = 'Shift [Q] to PAST, enter the Chrono Vault, and repair Cooling Turbine Beta!';
      toast = 'Past Changed: Chrono Vault opened in 2089!';
    } else if (obj.id === 'override3') {
      const shield = level.barriers.find((b) => b.id === 'core_shield3');
      if (shield) shield.active = false;
      level.objective = 'Drop down right and enter the Central Chrono Core!';
      toast = 'Final Override: Chrono Core Shield deactivated!';
    }
    return {
      executed: true,
      scoreDelta: 250,
      energyDelta: 0,
      toast,
      particleColor: '#38bdf8',
      particleX: obj.x,
      particleY: obj.y,
      particleCount: 26,
      particleTimeline: 'both',
      shake: 0.16
    };
  }

  if (obj.kind === 'pillar') {
    obj.done = true;
    level.state.bridgeCollapsed = true;
    const cover = level.dynamicPlatforms.find((d) => d.id === 'bridge_cover');
    const wreck = level.barriers.find((b) => b.id === 'bridge_block');
    if (cover) cover.active = false;
    if (wreck) wreck.active = false;
    level.objective = 'Shift [Q] to FUTURE, drop into the subway, then restore the Past Generator!';
    return {
      executed: true,
      scoreDelta: 250,
      energyDelta: 0,
      toast: 'Future Changed: Viaduct collapsed, opening the Subway!',
      particleColor: '#fb923c',
      particleX: 640,
      particleY: 560,
      particleCount: 28,
      particleTimeline: 'future',
      shake: 0.45
    };
  }

  // generator
  obj.done = true;
  level.state.generatorOn = true;
  for (const el of level.elevators) el.active = true;
  level.objective =
    level.num === 2
      ? 'Shift [Q] to FUTURE, ride the Skyscraper Elevator, and enter the Portal!'
      : 'Shift [Q] to FUTURE, ride the Anti-Grav Lift, and unlock the Final Override!';
  return {
    executed: true,
    scoreDelta: 250,
    energyDelta: 0,
    toast: 'Future Changed: Elevator power restored in 2189!',
    particleColor: '#38bdf8',
    particleX: obj.x,
    particleY: obj.y,
    particleCount: 26,
    particleTimeline: 'both',
    shake: 0.24
  };
}

export interface StepInput {
  moveDir: -1 | 0 | 1;
  jumpHeld: boolean;
  jumpJustReleased: boolean;
}

export interface StepEvents {
  jumped: boolean;
  landed: boolean;
  pitFall: boolean;
  hazardHit: boolean;
  fragmentCollected: { x: number; y: number } | null;
  portalReached: boolean;
}

export function stepSimulation(
  level: LevelData,
  player: PlayerState,
  anchor: Timeline,
  checkpoint: { x: number; y: number },
  freezeTimer: number,
  input: StepInput,
  dt: number
): StepEvents {
  const events: StepEvents = {
    jumped: false,
    landed: false,
    pitFall: false,
    hazardHit: false,
    fragmentCollected: null,
    portalReached: false
  };

  for (const dp of level.dynamicPlatforms) {
    if (dp.active && dp.growAnim < 1) {
      dp.growAnim = Math.min(1, dp.growAnim + dt * 2.1);
    }
  }

  for (const el of level.elevators) {
    if (!el.active) continue;
    const oldY = el.y;
    el.y += el.dir * el.speed * dt;
    if (el.y <= el.minY) {
      el.y = el.minY;
      el.dir = 1;
    }
    if (el.y >= el.maxY) {
      el.y = el.maxY;
      el.dir = -1;
    }
    el.dy = el.y - oldY;
    if (
      anchor === el.timeline &&
      player.onGround &&
      player.x + player.w > el.x &&
      player.x < el.x + el.w &&
      Math.abs(player.y + player.h - oldY) < 8
    ) {
      player.y += el.dy;
    }
  }

  if (freezeTimer <= 0) {
    for (const hz of level.hazards) {
      hz.x += hz.vx * dt;
      if (hz.x <= hz.minX) {
        hz.x = hz.minX;
        hz.vx = Math.abs(hz.vx);
      }
      if (hz.x >= hz.maxX) {
        hz.x = hz.maxX;
        hz.vx = -Math.abs(hz.vx);
      }
    }
  }

  player.vx = input.moveDir * MOVE_SPEED;
  if (input.moveDir !== 0) {
    player.facing = input.moveDir;
  }

  if (player.onGround) {
    player.coyote = 0.11;
  } else {
    player.coyote = Math.max(0, player.coyote - dt);
  }

  if (player.jumpBuffer > 0) {
    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
  }

  if (player.jumpBuffer > 0 && player.coyote > 0) {
    player.vy = JUMP_VEL;
    player.onGround = false;
    player.coyote = 0;
    player.jumpBuffer = 0;
    player.scaleX = 0.84;
    player.scaleY = 1.18;
    events.jumped = true;
  }

  // Variable jump height cut when jump key is released early
  if (input.jumpJustReleased && player.vy < -180) {
    player.vy *= 0.48;
  }

  player.vy = Math.min(920, player.vy + GRAVITY * dt);

  const solids = getActiveSolids(level, anchor);

  const prevX = player.x;
  player.x += player.vx * dt;
  player.x = Math.max(0, Math.min(level.worldWidth - player.w, player.x));
  for (const s of solids) {
    if (aabb(player, s)) {
      if (player.vx > 0) player.x = s.x - player.w;
      else if (player.vx < 0) player.x = s.x + s.w;
    }
  }

  // Sync walk cycle strictly to horizontal distance traveled so zero skating
  const dx = Math.abs(player.x - prevX);
  if (player.onGround && dx > 0.05) {
    player.walkCycle += dx * 0.13;
  } else if (player.onGround) {
    player.walkCycle = 0;
  }

  const wasOnGround = player.onGround;
  player.y += player.vy * dt;
  player.onGround = false;
  for (const s of solids) {
    if (aabb(player, s)) {
      if (player.vy > 0) {
        player.y = s.y - player.h;
        if (!wasOnGround && player.vy > 220) {
          player.scaleX = 1.2;
          player.scaleY = 0.8;
          events.landed = true;
        }
        player.vy = 0;
        player.onGround = true;
        if (s.h >= 120) {
          checkpoint.x = player.x;
          checkpoint.y = player.y;
        }
      } else if (player.vy < 0) {
        player.y = s.y + s.h;
        player.vy = 0;
      }
    }
  }

  // Exponentially damp squash & stretch back to 1
  const damp = 1 - Math.exp(-16 * dt);
  player.scaleX += (1 - player.scaleX) * damp;
  player.scaleY += (1 - player.scaleY) * damp;
  player.scarfPhase += dt * (4.5 + Math.abs(player.vx) * 0.025);

  if (player.y > LOGICAL_H + 40) {
    player.x = checkpoint.x;
    player.y = checkpoint.y - 10;
    player.vx = 0;
    player.vy = 0;
    events.pitFall = true;
  }

  if (freezeTimer <= 0) {
    for (const hz of level.hazards) {
      if (hz.timeline === anchor && aabb(player, hz)) {
        player.x = Math.max(20, checkpoint.x);
        player.y = checkpoint.y - 10;
        player.vx = 0;
        player.vy = 0;
        events.hazardHit = true;
        break;
      }
    }
  }

  for (const frag of level.fragments) {
    if (!frag.collected && frag.timeline === anchor) {
      const dist = Math.hypot(player.x + player.w / 2 - frag.x, player.y + player.h / 2 - frag.y);
      if (dist < 34) {
        frag.collected = true;
        events.fragmentCollected = { x: frag.x, y: frag.y };
      }
    }
  }

  const portal = level.portal;
  if (portal.timeline === anchor) {
    const dist = Math.hypot(player.x + player.w / 2 - portal.x, player.y + player.h / 2 - (portal.y + 40));
    if (dist < 44) {
      events.portalReached = true;
    }
  }

  return events;
}

export function calculateLevelScore(baseScore: number, elapsedSeconds: number): number {
  const timeBonus = Math.max(0, Math.round(500 - elapsedSeconds * 3));
  return baseScore + 400 + timeBonus;
}
