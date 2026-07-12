import test from 'node:test';
import assert from 'node:assert/strict';
import { Status } from '../src/ai/behavior-tree.js';
import {
  computeStandoffVelocity,
  createStalkerBlackboard,
  createStalkerTree,
  updateStalkerBlackboard,
} from '../src/ai/trees/stalker-tree.js';
import { DT, makeStalkerFixture, tickUntil } from '../test-helpers/stalker-fixture.js';

test('createStalkerBlackboard starts with heal flag cleared', () => {
  const bb = createStalkerBlackboard({ x: 0, y: 0 }, { x: 1, y: 0 });
  assert.equal(bb.playerJustHealed, false);
  assert.equal(bb.healAge, Infinity);
  assert.equal(bb.lungeCooldown, 0);
});

test('updateStalkerBlackboard ages heal signal and cools down lunge', () => {
  const bb = createStalkerBlackboard({ x: 0, y: 0 }, { x: 1, y: 0 });
  bb.playerJustHealed = true;
  bb.healAge = 0;
  bb.lungeCooldown = 0.3;

  updateStalkerBlackboard(bb, 0.1);
  assert.equal(bb.healAge, 0.1);
  assert.ok(Math.abs(bb.lungeCooldown - 0.2) < 1e-9);
});

test('computeStandoffVelocity retreats when too close', () => {
  const v = computeStandoffVelocity(
    { x: 0, y: 0 },
    { x: 50, y: 0 },
    { preferredRange: 100, rangeTolerance: 10, strafeSign: 1 },
  );
  assert.ok(v.x < 0, 'should move away on x');
});

test('computeStandoffVelocity advances when too far', () => {
  const v = computeStandoffVelocity(
    { x: 0, y: 0 },
    { x: 200, y: 0 },
    { preferredRange: 100, rangeTolerance: 10, strafeSign: 1 },
  );
  assert.ok(v.x > 0, 'should move toward player on x');
});

test('computeStandoffVelocity only strafes inside preferred band', () => {
  const v = computeStandoffVelocity(
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { preferredRange: 100, rangeTolerance: 10, strafeSign: 1 },
  );
  assert.ok(Math.abs(v.x) < 1e-9);
  assert.notEqual(v.y, 0);
});

test('maintains distance by retreating when too close', () => {
  const { enemy, player, bb, tree } = makeStalkerFixture({ player: { x: 40, y: 0 } });
  assert.equal(tree.tick(DT, bb), Status.SUCCESS);
  assert.ok(enemy.x < 0);
});

test('maintains distance by advancing when too far', () => {
  const { enemy, player, bb, tree } = makeStalkerFixture({ player: { x: 200, y: 0 } });
  assert.equal(tree.tick(DT, bb), Status.SUCCESS);
  assert.ok(enemy.x > 0);
});

test('faces the player while maintaining distance', () => {
  const { enemy, bb, tree } = makeStalkerFixture({ player: { x: 0, y: -80 } });
  tree.tick(DT, bb);
  assert.ok(enemy.facing.y < 0);
});

test('fails maintain distance when player is missing', () => {
  const { bb, tree } = makeStalkerFixture();
  bb.player = null;
  assert.equal(tree.tick(DT, bb), Status.FAILURE);
});

test('lunges toward player when heal flag is fresh', () => {
  const { enemy, bb, tree } = makeStalkerFixture({ player: { x: 120, y: 0 } });
  bb.playerJustHealed = true;
  bb.healAge = 0;

  const { status } = tickUntil(tree, bb, (s) => s !== Status.RUNNING);
  assert.equal(status, Status.SUCCESS);
  assert.ok(enemy.x > 0);
  assert.equal(bb.playerJustHealed, false);
  assert.equal(enemy.lunging, false);
});

test('lunge returns RUNNING until duration elapses', () => {
  const { bb, tree } = makeStalkerFixture({ player: { x: 120, y: 0 } });
  bb.playerJustHealed = true;
  bb.healAge = 0;

  assert.equal(tree.tick(DT, bb), Status.RUNNING);
});

test('ignores stale heal events outside reaction window', () => {
  const { enemy, bb, tree } = makeStalkerFixture({ player: { x: 40, y: 0 } });
  bb.playerJustHealed = true;
  bb.healAge = 1;

  tree.tick(DT, bb);
  assert.equal(enemy.lunging, false);
});

test('does not lunge while cooldown is active', () => {
  const { enemy, bb, tree } = makeStalkerFixture({ player: { x: 120, y: 0 } });
  const startX = enemy.x;
  bb.playerJustHealed = true;
  bb.healAge = 0;
  bb.lungeCooldown = 0.2;

  tree.tick(DT, bb);
  assert.equal(enemy.lunging, false);
  assert.notEqual(enemy.x, startX, 'should still maintain distance while cooling down');
});

test('sets lunge cooldown after completing lunge', () => {
  const { bb, tree } = makeStalkerFixture({
    player: { x: 120, y: 0 },
    tree: { lungeCooldown: 0.5 },
  });
  bb.playerJustHealed = true;
  bb.healAge = 0;

  tickUntil(tree, bb, (s) => s !== Status.RUNNING);
  assert.equal(bb.lungeCooldown, 0.5);
});
