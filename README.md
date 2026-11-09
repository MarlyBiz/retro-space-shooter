# Retro Space Shooter

Mobile-first arcade shooter (**v3.1**). Ten-level campaign in **light years** (L1=2000, then +500/level, cap 5000). Even levels end with the recurring **GUNSHIP** boss — destroy it on level 10. Network-first PWA updates so you always get the latest build.

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
