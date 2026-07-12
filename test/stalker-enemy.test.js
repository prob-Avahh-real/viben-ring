import test from 'node:test';
import assert from 'node:assert/strict';
import { StalkerEnemy } from '../src/entities/stalker-enemy.js';
import { emit, resetEvents } from '../src/systems/game-events.js';
import { DT } from '../test-helpers/stalker-fixture.js';

test('StalkerEnemy reacts to player:healed events', () => {
  resetEvents();
  const player = { x: 120, y: 0 };
  const enemy = new StalkerEnemy(0, 0, { player });

  emit('player:healed', { amount: 30 });
  assert.equal(enemy.blackboard.playerJustHealed, true);
  assert.equal(enemy.blackboard.healAge, 0);

  enemy.destroy();
});

test('StalkerEnemy update moves enemy toward player after heal', () => {
  resetEvents();
  const player = { x: 120, y: 0 };
  const enemy = new StalkerEnemy(0, 0, {
    player,
    preferredRange: 100,
    rangeTolerance: 10,
    lungeDuration: 0.2,
    lungeCooldown: 0.5,
    healReactionWindow: 0.5,
    rng: () => 1,
  });

  emit('player:healed', { amount: 10 });

  for (let i = 0; i < 20; i += 1) enemy.update(DT);
  assert.ok(enemy.x > 0);

  enemy.destroy();
});

test('StalkerEnemy destroy stops heal subscription', () => {
  resetEvents();
  const player = { x: 120, y: 0 };
  const enemy = new StalkerEnemy(0, 0, { player });
  enemy.destroy();

  emit('player:healed', { amount: 5 });
  assert.equal(enemy.blackboard.playerJustHealed, false);
});

test('StalkerEnemy setPlayer updates blackboard target', () => {
  resetEvents();
  const enemy = new StalkerEnemy(0, 0, {});
  const player = { x: 50, y: 0 };
  enemy.setPlayer(player);
  assert.equal(enemy.blackboard.player, player);
  enemy.destroy();
});
