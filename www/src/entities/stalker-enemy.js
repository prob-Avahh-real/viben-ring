import { BehaviorTree } from '../ai/behavior-tree.js';
import {
  createStalkerBlackboard,
  createStalkerTree,
  updateStalkerBlackboard,
} from '../ai/trees/stalker-tree.js';
import { on } from '../systems/game-events.js';

export class StalkerEnemy {
  constructor(x, y, config = {}) {
    this.x = x;
    this.y = y;
    this.radius = config.radius ?? 18;
    this.lunging = false;
    this.lungeTime = 0;
    this.lungeDir = { x: 1, y: 0 };
    this.facing = { x: 1, y: 0 };

    this.blackboard = createStalkerBlackboard(this, config.player);
    this.tree = new BehaviorTree(
      createStalkerTree(config),
      this.blackboard,
    );
    this.unsubscribeHeal = on('player:healed', () => {
      this.blackboard.playerJustHealed = true;
      this.blackboard.healAge = 0;
    });
  }

  setPlayer(player) {
    this.blackboard.player = player;
  }

  update(dt) {
    updateStalkerBlackboard(this.blackboard, dt);
    this.tree.tick(dt);
  }

  destroy() {
    this.unsubscribeHeal?.();
  }
}
