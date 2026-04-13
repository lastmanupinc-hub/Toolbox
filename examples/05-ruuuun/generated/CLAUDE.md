# 1. RUUUUN!!! = Roblox battle royale. Loot-scramble → procedural maze chase.
# 2. Lua + Roblox Studio. ~90 files. 2–50 players, 5–10 minute rounds.
# 3. Server authority model: all game state on ServerScriptService.
# 4. Client: StarterPlayer for UI, input, effects. No game logic on client.
# 5. RemoteEvents (client → server), RemoteFunctions (server → client).
# 6. Maze generation: seeded RNG, deterministic per round. Seed = round ID.
# 7. Loot tables: 5 rarity tiers. Drop rates in ReplicatedStorage/ItemData.
# 8. Progression: XP per round, unlocks at thresholds, DataStoreService persistence.
# 9. Content rating: 9+ (Mild). No blood, no gambling, Roblox guidelines compliant.
# 10. Expansion packs: new mazes, items, and game modes added modularly.
