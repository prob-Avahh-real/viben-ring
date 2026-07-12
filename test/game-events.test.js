import test from 'node:test';
import assert from 'node:assert/strict';
import { emit, on, resetEvents } from '../src/systems/game-events.js';

test('on + emit delivers payload to subscriber', () => {
  resetEvents();
  const received = [];
  on('player:healed', (payload) => received.push(payload));
  emit('player:healed', { amount: 25 });
  assert.deepEqual(received, [{ amount: 25 }]);
});

test('unsubscribe stops delivery', () => {
  resetEvents();
  const received = [];
  const off = on('player:healed', (payload) => received.push(payload));
  emit('player:healed', { amount: 1 });
  off();
  emit('player:healed', { amount: 2 });
  assert.deepEqual(received, [{ amount: 1 }]);
});
