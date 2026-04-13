# AGENTS.md — ruuuun

## Project Context

This is a **game** built with **Lua** for **Roblox**.
RUUUUN!!! is a battle royale: loot-scramble opener
into a procedurally generated maze chase.

### Stack

- Lua · Roblox Studio · RemoteEvents · DataStoreService

### Game Loop

1. Lobby   — 2–50 players queue (30s countdown)
2. Loot    — scramble for weapons, items, power-ups
3. Maze    — procedural generation, PvE chase begins
4. Extract — reach exit or be eliminated

### Architecture

| Folder              | Role                         |
|---------------------|------------------------------|
| ServerScriptService | Authority, game state, spawns|
| ReplicatedStorage   | Shared modules, item data    |
| StarterPlayer       | Client UI, input handling    |
| RUUUN!/             | Game assets, maps            |

### Systems

- Procedural maze generation (deterministic seeded)
- Loot tables with rarity tiers (Common → Legendary)
- Progression system with XP and unlocks
- Expansion packs for new content
- No Fate compliance (content rating 9+)

### Key Modules

| Module            | Location           | Purpose               |
|-------------------|--------------------|------------------------|
| GameManager       | ServerScriptService| Round lifecycle        |
| MazeGenerator     | ServerScriptService| Procedural maze        |
| LootSystem        | ServerScriptService| Item spawning + drops  |
| PlayerController  | StarterPlayer      | Movement + input       |
| UIManager         | StarterPlayer      | HUD, inventory, menus  |

### Conventions

- Server authority: game state only on server
- RemoteEvents for client → server communication
- RemoteFunctions for server → client queries
- DataStoreService for player persistence
- All randomness uses seeded RNG for replays
