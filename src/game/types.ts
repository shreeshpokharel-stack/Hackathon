export const LOGICAL_W = 1280;
export const LOGICAL_H = 720;
export const HALF_W = 640;

export const GRAVITY = 1400;
export const MOVE_SPEED = 275;
export const JUMP_VEL = -585;

export type Timeline = 'past' | 'future';
export type GameMode = 'title' | 'playing' | 'paused' | 'gameover';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DynamicPlatform extends Rect {
  id: string;
  timeline: Timeline;
  active: boolean;
  growAnim: number;
  kind: 'tree' | 'crystalTree' | 'bridge';
}

export interface Barrier extends Rect {
  id: string;
  timeline: Timeline;
  active: boolean;
  kind: 'stoneGate' | 'ruinWall' | 'wreck' | 'energyShield';
}

export interface Hazard extends Rect {
  id: string;
  timeline: Timeline;
  minX: number;
  maxX: number;
  vx: number;
}

export interface Elevator extends Rect {
  id: string;
  timeline: Timeline;
  active: boolean;
  minY: number;
  maxY: number;
  dir: 1 | -1;
  speed: number;
  dy?: number;
}

export interface Interactable {
  id: string;
  timeline: Timeline;
  x: number;
  y: number;
  label: string;
  done: boolean;
  kind: 'butterfly' | 'seed' | 'soil' | 'conduit' | 'pillar' | 'generator';
}

export interface Fragment {
  id: string;
  timeline: Timeline;
  x: number;
  y: number;
  collected: boolean;
}

export interface Portal {
  timeline: Timeline;
  x: number;
  y: number;
  unlocked: boolean;
}

export interface LevelState {
  hasSeed: boolean;
  treeGrown?: boolean;
  gateOpened?: boolean;
  bridgeCollapsed?: boolean;
  generatorOn?: boolean;
  butterfly: boolean;
}

export interface LevelData {
  num: 1 | 2 | 3;
  name: string;
  worldWidth: number;
  spawn: { x: number; y: number };
  objective: string;
  hint: string;
  pastPlatforms: Rect[];
  futurePlatforms: Rect[];
  dynamicPlatforms: DynamicPlatform[];
  barriers: Barrier[];
  hazards: Hazard[];
  elevators: Elevator[];
  interactables: Interactable[];
  fragments: Fragment[];
  portal: Portal;
  state: LevelState;
}

export interface PlayerState {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  onGround: boolean;
  coyote: number;
  jumpBuffer: number;
  walkCycle: number;
  interactAnim: number;
  scaleX: number;
  scaleY: number;
  scarfPhase: number;
}

export interface SaveRecord {
  bestScore: number;
  frags: number;
  butterfly: boolean;
}

export interface SaveData {
  unlockedLevel: number;
  totalScore: number;
  levels: Record<number, SaveRecord>;
}

export interface HudSnapshot {
  levelNum: 1 | 2 | 3;
  levelName: string;
  objective: string;
  anchor: Timeline;
  energy: number;
  maxEnergy: number;
  freezeTimer: number;
  fragmentsCollected: number;
  fragmentsTotal: number;
  butterfly: boolean;
  score: number;
  elapsed: number;
}

export interface CompletionSnapshot {
  levelNum: 1 | 2 | 3;
  score: number;
  elapsed: number;
  fragmentsCollected: number;
  fragmentsTotal: number;
  butterfly: boolean;
  isFinalChapter: boolean;
}
