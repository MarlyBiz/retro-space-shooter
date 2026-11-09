# Retro Space Shooter

Mobile-first arcade shooter (**v4.0**). Ten-level campaign in **light years** (L1=2000, then +500/level, cap 5000). Even levels end with the recurring **GUNSHIP** boss — destroy it on level 10. Network-first PWA updates so you always get the latest build.

**Play:** https://marlybiz.github.io/retro-space-shooter/

- Level lengths: `min(5000, 2000+(level-1)*500)` LY per level; HUD distance is cumulative.
- Touch/drag to move. Auto-fire. Desktop: arrows / A D. Escape/P pauses.
- Power-ups: Twin, Spread, Rapid, Laser, Homing Rockets, Bomb, Repair, 1-Up.

- Enemies and collectibles stay visible and reachable, including after rotation/Continue.
- Recovery drops adapt to low homeland power/lives; advanced weapons become likelier later.
- GUNSHIP encounters L2/4/6/8/10: HP 36/54/72/90/108; average shot interval 60/57/54/51/48 frames (±10%); movement speed 1.4/1.55/1.7/1.85/2; projectile speed 3/3.1/3.2/3.3/3.4. Five sequential guns, early retreats, no regular enemies in boss fights.
- Final victory: animated breakup, nebula flight, then Play Again/Home. Ending progress supports pause/background/Continue; existing v6 saves remain compatible.
- Homing weapon: 15s, one 2-damage rocket every 32 frames; speed 7, bounded steering and 150-frame projectile lifetime. Drop weight 1→2 from L1→L10.

Tests: `npm ci && npm test` (real CPU Canvas, not permissive drawing stubs). No build step; static HTML/JS/PWA.

Game Options (Home/Pause): weapon duration Normal (15s), 2× (30s), 3× (45s), Unlimited; pickup frequency Normal/More (1.5×). Duration changes apply to the next weapon pickup, leaving the current gun unchanged. Unlimited keeps the acquired gun through life loss until another weapon replaces it; damage still costs lives. Home changes apply to new runs; Continue restores the saved run’s options. Reset Defaults restores Normal/Normal. Targeted test: `npm run test:options`.

Cinematic art (v3.0): generated realistic metal/glass artwork for all six enemies, GUNSHIP, player and homeland base. One transparent versioned WebP atlas (about 418 KiB), asynchronously swapped as a complete family with immediate original-art fallback. Offline asset precaching; app shell remains network-first. Gameplay geometry and all v2.9 options remain unchanged. Test loading/rendering/mobile sizes/ending/offline caching: `npm run test:art`.

Motion (v3.1): player ship and side-moving enemies bank with speed (canvas roll, same art and hitboxes); player can climb into the lower 45% of the playfield (Up/W or drag up) and eases back to the home line on release; boss hits shake the hull with an outline-hugging glow instead of a box. `node tests/motion.test.cjs`.

v4.0 campaign: pick 10/20/30/40/50 levels (menu + Options, persisted; Continue keeps its run's length; older saves = 10). Bosses own 10-level blocks — GUNSHIP 1-10, DREADNOUGHT 11-20 (turret spread volleys), HIVE QUEEN 21-30 (drone swarms), ECLIPSE 31-40 (cloak, teleport, telegraphed eye beam), WARLORD 41-50 (rotating cannon ring + earlier attacks). Each attacks after every even level, retreats, and is destroyed on its block's 10th level (breakup + nebula, then the next sector). New enemies: RAM L11, MORTAR L16, DRONE L21, SPINNER L26, WRAITH L31, PHANTOM L36, LANCER L41, BULWARK L46. Single atlas assets/sprites-v4.webp (~690 KiB). Banking is roll-only (width compress + alpha-clipped shading, no heading rotation). Tests: `node tests/campaign.test.cjs`.
