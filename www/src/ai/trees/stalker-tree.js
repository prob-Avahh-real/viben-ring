import {
  Action,
  Condition,
  Selector,
  Sequence,
  Status,
} from '../behavior-tree.js';

function distance(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

function direction(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

function perpendicular(dir) {
  return { x: -dir.y, y: dir.x };
}

export function computeStandoffVelocity(enemy, player, config) {
  const {
    preferredRange = 140,
    rangeTolerance = 24,
    strafeSpeed = 90,
    retreatSpeed = 110,
    advanceSpeed = 80,
    strafeSign = 1,
  } = config;

  const dist = distance(enemy, player);
  const toward = direction(enemy, player);
  const away = { x: -toward.x, y: -toward.y };
  const side = perpendicular(toward);

  let vx = side.x * strafeSpeed * strafeSign;
  let vy = side.y * strafeSpeed * strafeSign;

  if (dist < preferredRange - rangeTolerance) {
    vx += away.x * retreatSpeed;
    vy += away.y * retreatSpeed;
  } else if (dist > preferredRange + rangeTolerance) {
    vx += toward.x * advanceSpeed;
    vy += toward.y * advanceSpeed;
  }

  return { x: vx, y: vy };
}

/**
 * Enemy that keeps a preferred standoff range and punishes healing
 * with a forward lunge.
 */
export function createStalkerTree(config = {}) {
  const {
    preferredRange = 140,
    rangeTolerance = 24,
    lungeSpeed = 520,
    lungeDuration = 0.35,
    lungeCooldown = 1.2,
    healReactionWindow = 0.6,
    strafeSpeed = 90,
    retreatSpeed = 110,
    advanceSpeed = 80,
    rng = Math.random,
  } = config;

  return new Selector('StalkerRoot', [
    new Sequence('LungeOnHeal', [
      new Condition('PlayerJustHealed', (_dt, bb) => {
        if (!bb.playerJustHealed) return false;
        if (bb.healAge > healReactionWindow) return false;
        if (bb.lungeCooldown > 0) return false;
        return true;
      }),
      new Action('ExecuteLunge', (dt, bb) => {
        const enemy = bb.enemy;
        const player = bb.player;

        if (!enemy.lunging) {
          enemy.lunging = true;
          enemy.lungeTime = 0;
          enemy.lungeDir = direction(enemy, player);
          bb.playerJustHealed = false;
        }

        enemy.lungeTime += dt;
        enemy.x += enemy.lungeDir.x * lungeSpeed * dt;
        enemy.y += enemy.lungeDir.y * lungeSpeed * dt;

        if (enemy.lungeTime >= lungeDuration) {
          enemy.lunging = false;
          bb.lungeCooldown = lungeCooldown;
          return Status.SUCCESS;
        }

        return Status.RUNNING;
      }),
    ]),

    new Sequence('MaintainDistance', [
      new Condition('HasPlayer', (_dt, bb) => Boolean(bb.player)),
      new Action('KeepStandoffRange', (dt, bb) => {
        const enemy = bb.enemy;
        const player = bb.player;

        bb.strafeSign ??= 1;
        if (rng() < 0.01) bb.strafeSign *= -1;

        const velocity = computeStandoffVelocity(enemy, player, {
          preferredRange,
          rangeTolerance,
          strafeSpeed,
          retreatSpeed,
          advanceSpeed,
          strafeSign: bb.strafeSign,
        });

        enemy.x += velocity.x * dt;
        enemy.y += velocity.y * dt;
        enemy.facing = direction(enemy, player);

        return Status.SUCCESS;
      }),
    ]),
  ]);
}

export function createStalkerBlackboard(enemy, player) {
  return {
    enemy,
    player,
    playerJustHealed: false,
    healAge: Infinity,
    lungeCooldown: 0,
    strafeSign: 1,
  };
}

export function updateStalkerBlackboard(bb, dt) {
  if (bb.playerJustHealed) bb.healAge += dt;
  if (bb.lungeCooldown > 0) bb.lungeCooldown = Math.max(0, bb.lungeCooldown - dt);
}
