# viben ring

结合智能戒指/智能手杖体感输入的 2D 战术竞技场与敌人行为树（Behavior Tree）工程（已归档于 `archive/from-home/viben ring`）。

## 核心架构

- `src/ai/behavior-tree.js`：轻量可扩展行为树内核（`Selector`、`Sequence`、`Condition`、`Action`）
- `src/ai/trees/stalker-tree.js`：保持理想对峙距离（Standoff Range）、环绕走位并在玩家治疗窗口期触发突刺惩罚（`LungeOnHeal`）的战术 AI
- `src/entities/stalker-enemy.js` & `src/systems/game-events.js`：敌人实体与解耦事件总线（`player:healed` 等）
- `index.html` & `wearable-input.js`：Capacitor 移动端竞技场视图与戒指（`DeviceOrientation`）/手杖（`DeviceMotion`）输入桥接

## 目标平台（Target 判定）

- **移动端**：需要（Capacitor Android，`com.skat.vibenring`）
- **智能硬件**：需要（智能戒指倾斜走位 / 摇晃闪避，智能手杖敲击治疗，手表窄屏 CSS）

## 快速运行与验证

```bash
npm test
npm run build
```
