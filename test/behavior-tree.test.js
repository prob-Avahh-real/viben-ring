import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Action,
  BehaviorTree,
  Condition,
  Selector,
  Sequence,
  Status,
} from '../src/ai/behavior-tree.js';

test('Sequence succeeds when all children succeed', () => {
  const seq = new Sequence('all-pass', [
    new Condition('a', () => true),
    new Action('b', () => Status.SUCCESS),
  ]);
  assert.equal(seq.tick(0, {}), Status.SUCCESS);
});

test('Sequence fails on first failing child', () => {
  const seq = new Sequence('fail-fast', [
    new Condition('a', () => false),
    new Action('b', () => Status.SUCCESS),
  ]);
  assert.equal(seq.tick(0, {}), Status.FAILURE);
});

test('Sequence returns RUNNING while a child is running', () => {
  let calls = 0;
  const seq = new Sequence('running-child', [
    new Action('a', () => {
      calls += 1;
      return calls < 2 ? Status.RUNNING : Status.SUCCESS;
    }),
    new Action('b', () => Status.SUCCESS),
  ]);

  assert.equal(seq.tick(0, {}), Status.RUNNING);
  assert.equal(seq.tick(0, {}), Status.SUCCESS);
});

test('Selector succeeds on first succeeding child', () => {
  const sel = new Selector('first-win', [
    new Condition('a', () => false),
    new Action('b', () => Status.SUCCESS),
  ]);
  assert.equal(sel.tick(0, {}), Status.SUCCESS);
});

test('Selector returns RUNNING from running child', () => {
  const sel = new Selector('running', [
    new Condition('a', () => false),
    new Action('b', () => Status.RUNNING),
  ]);
  assert.equal(sel.tick(0, {}), Status.RUNNING);
});

test('BehaviorTree delegates tick to root', () => {
  const tree = new BehaviorTree(
    new Action('root', (_dt, bb) => {
      bb.touched = true;
      return Status.SUCCESS;
    }),
    { touched: false },
  );
  assert.equal(tree.tick(1, tree.blackboard), Status.SUCCESS);
  assert.equal(tree.blackboard.touched, true);
});
