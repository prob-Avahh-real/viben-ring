export const Status = Object.freeze({
  SUCCESS: 'success',
  FAILURE: 'failure',
  RUNNING: 'running',
});

export class Blackboard {
  constructor(data = {}) {
    Object.assign(this, data);
  }
}

export class BehaviorNode {
  constructor(name) {
    this.name = name;
  }

  tick(dt, blackboard) {
    return Status.FAILURE;
  }
}

export class Sequence extends BehaviorNode {
  constructor(name, children = []) {
    super(name);
    this.children = children;
    this.index = 0;
  }

  tick(dt, blackboard) {
    while (this.index < this.children.length) {
      const status = this.children[this.index].tick(dt, blackboard);
      if (status === Status.RUNNING) return Status.RUNNING;
      if (status === Status.FAILURE) {
        this.index = 0;
        return Status.FAILURE;
      }
      this.index += 1;
    }
    this.index = 0;
    return Status.SUCCESS;
  }
}

export class Selector extends BehaviorNode {
  constructor(name, children = []) {
    super(name);
    this.children = children;
    this.index = 0;
  }

  tick(dt, blackboard) {
    while (this.index < this.children.length) {
      const status = this.children[this.index].tick(dt, blackboard);
      if (status === Status.RUNNING) return Status.RUNNING;
      if (status === Status.SUCCESS) {
        this.index = 0;
        return Status.SUCCESS;
      }
      this.index += 1;
    }
    this.index = 0;
    return Status.FAILURE;
  }
}

export class Condition extends BehaviorNode {
  constructor(name, predicate) {
    super(name);
    this.predicate = predicate;
  }

  tick(dt, blackboard) {
    return this.predicate(dt, blackboard) ? Status.SUCCESS : Status.FAILURE;
  }
}

export class Action extends BehaviorNode {
  constructor(name, fn) {
    super(name);
    this.fn = fn;
  }

  tick(dt, blackboard) {
    return this.fn(dt, blackboard);
  }
}

export class BehaviorTree {
  constructor(root, blackboard = new Blackboard()) {
    this.root = root;
    this.blackboard = blackboard;
  }

  tick(dt) {
    return this.root.tick(dt, this.blackboard);
  }
}
