import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLevel } from './levels';
import {
  aabb,
  applyInteraction,
  calculateLevelScore,
  computeChronoShift,
  createInitialPlayer,
  findNearestInteractable,
  getActiveSolids,
  stepSimulation
} from './physics';

test('AABB detects overlap and non-overlap accurately', () => {
  assert.equal(aabb({ x: 0, y: 0, w: 20, h: 20 }, { x: 10, y: 10, w: 20, h: 20 }), true);
  assert.equal(aabb({ x: 0, y: 0, w: 20, h: 20 }, { x: 25, y: 0, w: 20, h: 20 }), false);
});

test('Level 1 puzzle chain: Butterfly -> Seed -> Soil grows Future tree -> Conduit opens Past gate', () => {
  const lv = buildLevel(1);
  const player = createInitialPlayer(lv.spawn);

  // Move to Butterfly at x=230
  player.x = 220;
  player.y = 534;
  const bfly = findNearestInteractable(lv, player, 'past');
  assert.ok(bfly && bfly.kind === 'butterfly');
  const bflyRes = applyInteraction(lv, bfly);
  assert.equal(bflyRes.executed, true);
  assert.equal(lv.state.butterfly, true);
  assert.equal(bflyRes.scoreDelta, 300);

  // Try planting soil without seed -> rejected
  player.x = 580;
  player.y = 534;
  const soilEarly = findNearestInteractable(lv, player, 'past');
  assert.ok(soilEarly && soilEarly.kind === 'soil');
  const earlyRes = applyInteraction(lv, soilEarly);
  assert.equal(earlyRes.executed, false);

  // Collect seed at x=415, y=465
  player.x = 405;
  player.y = 459;
  const seed = findNearestInteractable(lv, player, 'past');
  assert.ok(seed && seed.kind === 'seed');
  applyInteraction(lv, seed);
  assert.equal(lv.state.hasSeed, true);

  // Plant at soil -> Future tree bridges become active
  player.x = 580;
  player.y = 534;
  const soil = findNearestInteractable(lv, player, 'past');
  assert.ok(soil);
  const plantRes = applyInteraction(lv, soil);
  assert.equal(plantRes.executed, true);
  assert.equal(lv.dynamicPlatforms.every((d) => d.active), true);

  // Future solids now include both tree platforms
  const futureSolids = getActiveSolids(lv, 'future');
  assert.ok(futureSolids.some((s) => s.x === 655));
  assert.ok(futureSolids.some((s) => s.x === 815));

  // Activate conduit in Future -> unlocks Past Stone Gate
  player.x = 1110;
  player.y = 534;
  const conduit = findNearestInteractable(lv, player, 'future');
  assert.ok(conduit && conduit.kind === 'conduit');
  applyInteraction(lv, conduit);
  const pastGate = lv.barriers.find((b) => b.id === 'past_gate_1');
  assert.equal(pastGate?.active, false);
});

test('Chrono Shift enforces energy cost, obstruction rejection, and subway step-up', () => {
  const lv = buildLevel(2);
  const player = createInitialPlayer(lv.spawn);

  // Low energy fails
  const lowEnergy = computeChronoShift(lv, player, 'past', 5);
  assert.equal(lowEnergy.ok, false);
  assert.equal(lowEnergy.reason, 'low_energy');

  // Inside Level 2 Future wreck barrier (x=630, y=310..580) fails as obstructed
  player.x = 640;
  player.y = 500;
  const blocked = computeChronoShift(lv, player, 'past', 100);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'obstructed');

  // Clear open floor shifts cleanly and deducts 8 energy
  player.x = 100;
  player.y = 534;
  const okShift = computeChronoShift(lv, player, 'past', 100);
  assert.equal(okShift.ok, true);
  assert.equal(okShift.targetAnchor, 'future');
  assert.equal(okShift.newEnergy, 92);

  // Standing in shallow Future subway (y=609, bottom=655) shifting back to Past ground (y=580, h=140) steps up cleanly
  player.x = 600;
  player.y = 609;
  const stepUp = computeChronoShift(lv, player, 'future', 90);
  assert.equal(stepUp.ok, true);
  assert.equal(stepUp.liftY, 580 - player.h);
});

test('Simulation step respects coyote jump, variable jump cut, frozen hazards, and portal win', () => {
  const lv = buildLevel(2);
  const player = createInitialPlayer({ x: 990, y: 534 });
  player.onGround = true;
  const checkpoint = { x: 80, y: 534 };

  // Coyote + jump buffer triggers jump
  player.jumpBuffer = 0.1;
  const jumpEvents = stepSimulation(
    lv,
    player,
    'future',
    checkpoint,
    5.0,
    { moveDir: 1, jumpHeld: true, jumpJustReleased: false },
    0.016
  );
  assert.equal(jumpEvents.jumped, true);
  assert.ok(player.vy < -500);

  // Releasing jump early cuts upward velocity
  const vyBeforeCut = player.vy;
  stepSimulation(
    lv,
    player,
    'future',
    checkpoint,
    5.0,
    { moveDir: 0, jumpHeld: false, jumpJustReleased: true },
    0.016
  );
  assert.ok(player.vy > vyBeforeCut * 0.6);

  // Frozen hazard does not hurt player even on overlap
  player.x = lv.hazards[0].x;
  player.y = lv.hazards[0].y;
  const frozenEvents = stepSimulation(
    lv,
    player,
    'future',
    checkpoint,
    3.0,
    { moveDir: 0, jumpHeld: false, jumpJustReleased: false },
    0.016
  );
  assert.equal(frozenEvents.hazardHit, false);

  // Unfrozen hazard resets player to checkpoint
  player.x = lv.hazards[0].x;
  player.y = lv.hazards[0].y;
  const hitEvents = stepSimulation(
    lv,
    player,
    'future',
    checkpoint,
    0,
    { moveDir: 0, jumpHeld: false, jumpJustReleased: false },
    0.016
  );
  assert.equal(hitEvents.hazardHit, true);
  assert.equal(player.x, checkpoint.x);

  // Scoring awards base + completion + decaying time bonus
  assert.equal(calculateLevelScore(500, 100), 1100);
  assert.equal(calculateLevelScore(500, 500), 900);
});
