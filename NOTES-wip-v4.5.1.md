Done: v4.5.1 chapter/boss start pickers jump to chapter FIRST level (1/11/21/31/41), not 10/20/30/40/50.
Cause: rebuilding START AT LEVEL could fire stale input/change and restore an end-of-chapter level (10/20/30/40/50); Start button / dropdown could disagree with the run that actually starts.
Fix: ignore picker events while rerendering; chapterStart helper; start button + dropdown match chosen start; "Bosses this run" labels show L1–10 ranges. End-after still 10/20/….
Tests: progress.test.cjs (incl. stale-select regression) + options + features version checks pass.
Next: merge, push, confirm live sw.js is rss-v4.5.1
