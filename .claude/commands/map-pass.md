Make the maps busier in $ARGUMENTS (an episode JSON; optionally followed by segment ids).

For each map segment (or only the listed ones):
- Read its `text`. Give it 3–6 `events` that act out what the narrator says, timed across the line
  (words ≈ 2.5 per second, so a thing mentioned at word 10 appears at t ≈ 4).
- Prefer movement: `move` (camel, ship, soldier, horse with `count`), `flow` for trade, `battle`,
  staggered `fill`, `scatter` of tokens, geo-anchored `label`, `pulse`, `arrow`.
- Keep coordinates real (lon, lat). Keep the camera continuous with the previous map segment.
- Don't add facts that aren't in the text.

Then run `npm run stills -- <episode> <changed ids>` with `AT=0.4,0.9` and Read the sheet.
Fix overlaps (labels on top of tokens, tokens under the mascot on the right, x > ~70% of frame).
