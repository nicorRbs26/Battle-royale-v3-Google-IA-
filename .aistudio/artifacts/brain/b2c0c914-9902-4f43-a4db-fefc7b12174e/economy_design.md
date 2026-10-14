# Economy Design Document: Core Loops

## I. Currency System
- **Soft Currency (Gold):** Primary resource for upgrades, consumables, and cosmetics. Earned through gameplay.
- **Experience Points (XP):** Non-currency progression resource used for level-ups and unlocking new gameplay features/difficulty tiers.

## II. Resource Loop (Source & Sink)

| Source | Description | Sink | Description |
| :--- | :--- | :--- | :--- |
| Match Reward | Gold based on performance | Upgrade | Power-ups / Stat boosts |
| Daily Quest | Flat gold bonus | Entry Fee | Cost for high-stakes modes |
| Objective Completion| Bonus gold for tasks | Cosmetics | Skins / UI themes |

## III. Progression Balancing
Progression follows a logarithmic curve to keep the cost of upgrades scaling with player power level.

**Formula (Upgrade Cost):**
`Cost = Base_Cost * (Level ^ 1.5)`

## IV. 30-Minute Gameplay Simulation

### Parameters
- **Base Upgrade Cost:** 50 Gold
- **Match Reward:** 175 Gold (avg)
- **Upgrade frequency:** 1 upgrade per 2 matches

### Simulation Results (30 Minutes / 3 Matches)
- **Total Income:** ~525 Gold
- **Total Spend (2 upgrades):** 100 Gold + Scaling
- **Net Balance:** ~400 Gold (Available for future sinks/cosmetics)
- **Progression:** Levels up twice (Level 1 -> 3), feels rewarding.
