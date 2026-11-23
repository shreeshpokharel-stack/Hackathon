import type { LevelData } from './types';

export interface LevelMeta {
  num: 1 | 2 | 3;
  title: string;
  subtitle: string;
  description: string;
}

export const LEVEL_META: LevelMeta[] = [
  {
    num: 1,
    title: 'The Forgotten Forest',
    subtitle: 'Chapter I',
    description: 'Plant ancient life in 2089 to bridge a shattered canyon in 2189.'
  },
  {
    num: 2,
    title: 'The Broken City',
    subtitle: 'Chapter II',
    description: 'Collapse a weakened viaduct, brave the submerged subway, and restore sky-lift power.'
  },
  {
    num: 3,
    title: 'The Paradox Core',
    subtitle: 'Chapter III',
    description: 'Synchronize relays across a century to unlock the central Chrono Core.'
  }
];

export function buildLevel(num: 1 | 2 | 3): LevelData {
  if (num === 1) {
    return {
      num: 1,
      name: 'LEVEL 1 · THE FORGOTTEN FOREST',
      worldWidth: 1780,
      spawn: { x: 80, y: 500 },
      objective: 'Free the butterfly (optional), claim the Ancient Seed, and plant it in fertile soil.',
      hint: 'Walk right in PAST (2089), press [E] on the glowing Seed, then plant it at the Soil near the chasm.',
      pastPlatforms: [
        { x: 0, y: 580, w: 1780, h: 140 },
        { x: 340, y: 505, w: 150, h: 20 },
        { x: 1310, y: 495, w: 140, h: 20 }
      ],
      futurePlatforms: [
        { x: 0, y: 580, w: 635, h: 140 },
        { x: 985, y: 580, w: 795, h: 140 }
      ],
      dynamicPlatforms: [
        { id: 'tree1_a', timeline: 'future', active: false, growAnim: 0, x: 655, y: 510, w: 140, h: 24, kind: 'tree' },
        { id: 'tree1_b', timeline: 'future', active: false, growAnim: 0, x: 815, y: 445, w: 150, h: 24, kind: 'tree' }
      ],
      barriers: [
        { id: 'past_gate_1', timeline: 'past', active: true, x: 1210, y: 0, w: 36, h: 580, kind: 'stoneGate' },
        { id: 'future_wall_1', timeline: 'future', active: true, x: 1250, y: 0, w: 40, h: 580, kind: 'ruinWall' }
      ],
      hazards: [],
      elevators: [],
      interactables: [
        { id: 'bfly1', timeline: 'past', x: 230, y: 538, label: '[E] Free Trapped Butterfly', done: false, kind: 'butterfly' },
        { id: 'seed1', timeline: 'past', x: 415, y: 465, label: '[E] Pick up Ancient Seed', done: false, kind: 'seed' },
        { id: 'soil1', timeline: 'past', x: 590, y: 545, label: '[E] Plant Ancient Seed', done: false, kind: 'soil' },
        { id: 'conduit1', timeline: 'future', x: 1120, y: 535, label: '[E] Send Power to Past Gate', done: false, kind: 'conduit' }
      ],
      fragments: [
        { id: 'f1_1', timeline: 'future', x: 890, y: 390, collected: false },
        { id: 'f1_2', timeline: 'past', x: 1380, y: 445, collected: false }
      ],
      portal: { timeline: 'past', x: 1580, y: 490, unlocked: true },
      state: { hasSeed: false, treeGrown: false, gateOpened: false, butterfly: false }
    };
  }

  if (num === 2) {
    return {
      num: 2,
      name: 'LEVEL 2 · THE BROKEN CITY',
      worldWidth: 1920,
      spawn: { x: 80, y: 500 },
      objective: 'Collapse the Future viaduct from the Past to descend into the underground subway.',
      hint: 'Break the Weak Bridge Support at x=370 in PAST [E], then Chrono Shift [Q] to FUTURE and drop below.',
      pastPlatforms: [
        { x: 0, y: 580, w: 1920, h: 140 },
        { x: 1010, y: 500, w: 110, h: 20 }
      ],
      futurePlatforms: [
        { x: 0, y: 580, w: 550, h: 140 },
        { x: 550, y: 655, w: 370, h: 65 },
        { x: 840, y: 615, w: 80, h: 40 },
        { x: 920, y: 580, w: 1000, h: 140 },
        { x: 1020, y: 500, w: 100, h: 20 },
        { x: 1450, y: 340, w: 430, h: 28 }
      ],
      dynamicPlatforms: [
        { id: 'bridge_cover', timeline: 'future', active: true, growAnim: 1, x: 550, y: 580, w: 220, h: 24, kind: 'bridge' }
      ],
      barriers: [
        { id: 'bridge_block', timeline: 'future', active: true, x: 630, y: 310, w: 85, h: 270, kind: 'wreck' },
        { id: 'past_city_wall', timeline: 'past', active: true, x: 1260, y: 0, w: 40, h: 580, kind: 'ruinWall' }
      ],
      hazards: [
        { id: 'drone2', timeline: 'future', x: 1000, y: 538, minX: 950, maxX: 1210, vx: 130, w: 34, h: 28 }
      ],
      elevators: [
        { id: 'elev2', timeline: 'future', active: false, x: 1310, y: 562, minY: 340, maxY: 562, w: 115, h: 18, dir: -1, speed: 95 }
      ],
      interactables: [
        { id: 'fountain2', timeline: 'past', x: 200, y: 538, label: '[E] Clear Dry Fountain', done: false, kind: 'butterfly' },
        { id: 'pillar2', timeline: 'past', x: 370, y: 532, label: '[E] Collapse Bridge Support', done: false, kind: 'pillar' },
        { id: 'gen2', timeline: 'past', x: 1140, y: 532, label: '[E] Restore City Generator', done: false, kind: 'generator' }
      ],
      fragments: [
        { id: 'f2_1', timeline: 'future', x: 730, y: 612, collected: false },
        { id: 'f2_2', timeline: 'future', x: 1520, y: 290, collected: false }
      ],
      portal: { timeline: 'future', x: 1730, y: 250, unlocked: true },
      state: { hasSeed: false, bridgeCollapsed: false, generatorOn: false, butterfly: false }
    };
  }

  return {
    num: 3,
    name: 'LEVEL 3 · THE PARADOX CORE',
    worldWidth: 2000,
    spawn: { x: 80, y: 500 },
    objective: 'Grow the Crystal Bridge, activate Future Relay Alpha, and unlock the Chrono Core.',
    hint: 'Nurture the Sapling, take the Crystal Seed at x=315, and plant it at the Core Soil (x=465).',
    pastPlatforms: [
      { x: 0, y: 580, w: 2000, h: 140 },
      { x: 260, y: 505, w: 110, h: 20 }
    ],
    futurePlatforms: [
      { x: 0, y: 580, w: 495, h: 140 },
      { x: 755, y: 580, w: 540, h: 140 },
      { x: 980, y: 500, w: 90, h: 20 },
      { x: 1290, y: 340, w: 250, h: 24 },
      { x: 1570, y: 500, w: 380, h: 220 }
    ],
    dynamicPlatforms: [
      { id: 'ctree3_a', timeline: 'future', active: false, growAnim: 0, x: 515, y: 510, w: 115, h: 22, kind: 'crystalTree' },
      { id: 'ctree3_b', timeline: 'future', active: false, growAnim: 0, x: 640, y: 445, w: 110, h: 22, kind: 'crystalTree' }
    ],
    barriers: [
      { id: 'vault3', timeline: 'past', active: true, x: 860, y: 0, w: 36, h: 580, kind: 'stoneGate' },
      { id: 'core_shield3', timeline: 'future', active: true, x: 1620, y: 0, w: 30, h: 500, kind: 'energyShield' }
    ],
    hazards: [
      { id: 'sentinel3', timeline: 'future', x: 960, y: 538, minX: 900, maxX: 1120, vx: 155, w: 36, h: 30 }
    ],
    elevators: [
      { id: 'lift3', timeline: 'future', active: false, x: 1165, y: 562, minY: 340, maxY: 562, w: 110, h: 18, dir: -1, speed: 105 }
    ],
    interactables: [
      { id: 'sapling3', timeline: 'past', x: 185, y: 538, label: '[E] Nurture Sanctuary Sapling', done: false, kind: 'butterfly' },
      { id: 'cseed3', timeline: 'past', x: 315, y: 465, label: '[E] Collect Crystal Seed', done: false, kind: 'seed' },
      { id: 'csoil3', timeline: 'past', x: 465, y: 545, label: '[E] Plant Crystal Seed', done: false, kind: 'soil' },
      { id: 'relay3', timeline: 'future', x: 810, y: 535, label: '[E] Activate Future Relay Alpha', done: false, kind: 'conduit' },
      { id: 'turbine3', timeline: 'past', x: 980, y: 532, label: '[E] Repair Cooling Turbine Beta', done: false, kind: 'generator' },
      { id: 'override3', timeline: 'future', x: 1470, y: 298, label: '[E] Unlock Final Core Shield', done: false, kind: 'conduit' }
    ],
    fragments: [
      { id: 'f3_1', timeline: 'future', x: 690, y: 390, collected: false },
      { id: 'f3_2', timeline: 'future', x: 1350, y: 285, collected: false }
    ],
    portal: { timeline: 'future', x: 1770, y: 410, unlocked: true },
    state: { hasSeed: false, butterfly: false }
  };
}
