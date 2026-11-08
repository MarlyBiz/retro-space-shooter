# Retro Space Shooter

Mobile-first arcade shooter (**v2.8**). Ten-level campaign in **light years** (L1=2000, then +500/level, cap 5000). Even levels end with the recurring **GUNSHIP** boss — destroy it on level 10. Network-first PWA updates so you always get the latest build.

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
