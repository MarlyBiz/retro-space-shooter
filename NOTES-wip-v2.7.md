Done: v2.7. All regular enemies and bosses keep their full width on screen and centers inside baseline muzzle reach; bounded sine paths and outward-only edge reflection; spawn/restore/rotation refits.
Drops: unchanged spawn cadence and L1 healthy distribution; quadratic repair/life need weighting; linear L1–10 spread/laser weighting. Existing arsenal/save schema/campaign/network-first update behavior retained.
Validation: node tests/game.test.cjs passes (172800 movement checks, 7200 real update-loop frames, bosses/rotation/retreat/restores/campaign, 400000 deterministic weighted selections); syntax/diff clean.
Next: publish main once, verify live HTML+SW and rerun same tests against fetched live HTML. No visual/device browser tool available in executor.
