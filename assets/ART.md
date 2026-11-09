# Cinematic sprite family — v3.0

Generated specifically for the requested game redesign: all six regular enemies,
GUNSHIP boss, player and panoramic homeland base. Metal plate seams, physically
lit bevels, glass canopies, industrial detailing, restrained emissive engines.
Faction colors and silhouettes are deliberately distinct at the original sizes.

Production atlas: sprites-v3.webp, 1664 × 988 RGBA, 427,610 bytes (417.6 KiB).
One versioned image request. Source images were tightly cropped, edge-connected
black background matted to alpha (interior shadows stay opaque), tuned for black
space, sharpened, then resized to the existing entity aspect ratios. Four-pixel
outer/eight-pixel inter-sprite gutters prevent bleeding. WebP quality 88 with
lossless alpha. No additional sprite padding or collision-box changes.

Rectangles live in ART_RECTS in index.html. Individual offscreen sprite canvases
are prepared once and swapped atomically. Small menu thumbnails avoid large
base64 atlas crops. Original pre-rendered drawings remain as immediate/error
fallbacks. Boss breakup samples the same new boss image; nebula flight samples
the redesigned hero. Thruster exhaust is now two small visual-only plumes.

Versioned art is precached/cache-first; HTML and service-worker updates stay
network-first. Failed art loading must never block a run. Tests use actual WebP
decoding and native CPU Canvas drawing, not drawing-method stubs.

## v4.0
sprites-v4.webp (2048 × 1510, ~690 KiB) replaces sprites-v3.webp: v3 sprites repacked, GUNSHIP redrawn in the high-detail concept style, four new bosses (DREADNOUGHT, HIVE QUEEN, ECLIPSE, WARLORD) and eight block-themed enemies. Generated on flat black, edge-connected matte, central blob kept, cropped. Build scripts: /workspace/shooter-art-review/build_v4.py + pack_v4.py.
