# Economic Design Plan: Single-Player Progression

## 1. Design Principles
- **Goal**: Create a sustainable, rewarding loop that supports long-term progression without premium currencies.
- **Economy Type**: Closed-loop (gameplay-driven).
- **Core Strategy**: Steady growth balanced by increasing costs to prevent runaway inflation.

## 2. Economic Variables
- **Soft Currency (Gold)**: Primary means of purchasing upgrades.
- **Formulas**:
  - **Cost (Tier `n`)**: `BaseCost * (1.5 ^ (n - 1))` (Exponential cost scaling).
  - **Reward (Level `n`)**: `BaseReward + (n * 50)` (Linear reward growth).

## 3. Gameplay Loops
- **Sources**:
  - Daily Missions (Reliable income).
  - Core Gameplay Tasks (Skill-based, variable rewards).
- **Sinks**:
  - Gear/Character Upgrades.
  - Resource Converters (Materials to Gold).

## 4. 30-Day Simulation Projection
- **Phase 1 (Days 1-7)**: Fast progress, low cost, focus on unlocking basic capabilities.
- **Phase 2 (Days 8-20)**: Steady progression, cost curves begin to bite, focus on efficiency.
- **Phase 3 (Days 21-30)**: Long-term optimization, high costs, focus on mastering systems.

## 5. Next Steps
1. Finalize the `BaseCost` and `BaseReward` parameters based on target time-to-progression.
2. Develop the Excel/TypeScript simulator for these parameters.
3. Integrate into game logic.
