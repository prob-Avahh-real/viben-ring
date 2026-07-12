import {
  createStalkerBlackboard,
  createStalkerTree,
} from '../src/ai/trees/stalker-tree.js';

export const DT = 1 / 60;

export function makeEnemy(overrides = {}) {
  return {
    x: 0,
    y: 0,
    lunging: false,
    lungeTime: 0,
    lungeDir: { x: 1, y: 0 },
    facing: { x: 1, y: 0 },
    ...overrides,
  };
}

export function makePlayer(overrides = {}) {
  return { x: 200, y: 0, ...overrides };
}

export function makeStalkerFixture(config = {}) {
  const enemy = makeEnemy(config.enemy);
  const player = makePlayer(config.player);
  const bb = createStalkerBlackboard(enemy, player);
  const tree = createStalkerTree({
    preferredRange: 100,
    rangeTolerance: 10,
    lungeDuration: 0.2,
    lungeCooldown: 0.5,
    healReactionWindow: 0.5,
    strafeSpeed: 90,
    retreatSpeed: 110,
    advanceSpeed: 80,
    rng: () => 1,
    ...config.tree,
  });
  return { enemy, player, bb, tree, config: config.tree ?? {} };
}

export function tickUntil(tree, bb, predicate, maxTicks = 120) {
  let status;
  for (let i = 0; i < maxTicks; i += 1) {
    status = tree.tick(DT, bb);
    if (predicate(status, i)) return { status, ticks: i + 1 };
  }
  return { status, ticks: maxTicks };
}
