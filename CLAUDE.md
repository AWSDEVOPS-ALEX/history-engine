# History Engine — notes for Claude Code

Faceless long-form history channel (Ethos-style: "The ENTIRE History of X in N minutes").
Everything on screen is drawn in Remotion code. No AI-generated images. Voice is Fish Audio.

## How an episode is made

1. Alexander supplies a researched script + fact sheet (`scripts-in/<ep>.md`). Never invent facts;
   never copy another channel's script.
2. Convert it to `episodes/<ep>.json` following `prompts/episode-json-prompt.md` and the types in
   `src/schema.ts` (single source of truth for the JSON shape).
3. `npm run voice -- episodes/<ep>.json` → Fish Audio clips + real durations written into the JSON.
4. `npm run stills -- episodes/<ep>.json [segment ids]` → `out/<ep>/stills/sheet.jpg` to check visuals.
5. `npm run render -- episodes/<ep>.json` → chapter chunks → `out/<ep>.mp4`.

## Keep token use low

- Episode work = edit the JSON. Only touch `src/` when adding a new kind of visual.
- To check visuals, run `stills` for the segments you changed and Read the one contact sheet.
  Never render full video to check something; never read rendered frames one by one.
- Don't read `node_modules/`, `out/`, `public/audio/`, or `world-atlas` JSON.
- Episode JSONs are long: search for a segment id (`grep -n '"c03-s07"'`) and read only that range.
- Use `npm run typecheck` after code edits instead of reading files back.

## Visual rules (from studying Ethos)

- New picture every 2–5 s. One segment = 8–20 spoken words.
- Maps must be busy: every map segment gets 3–6 `events` timed across the line
  (`move` caravans/ships/armies, `flow` trade, `battle`, `fill` with stagger, `scatter`, geo `label`s,
  `pulse`, `arrow`). Continue the camera: next map's `from` = previous map's `to`. Use `keys` for
  multi-stop camera moves. Zoom guide: 1 world, 3 region, 6 country, 12+ a battlefield.
- Mascot (the chronicler with the lantern staff) on most narration segments; change pose mid-line with
  `poses` when the line turns (surprise → confused, conflict → angry, punchline → happy).
- Skits: one line per segment, `scene` visual, 2–3 cast, speaker's line shows above them.
- Gray card + icon for ideas and jokes; `scroll` with dates at chapter breaks (`roll: "close"`).
- Real portraits/photos only from public-domain sources, saved in `public/archive/`, with the source
  noted in `episodes/<ep>.sources.md`.
- Hedge contested claims on screen exactly as the script hedges them.

## Code map

- `src/schema.ts` types · `src/SegmentView.tsx` picks the visual · `src/components/MapScene.tsx` maps + events
- `src/components/Character.tsx` puppet rig (mascot and cast) · `Sets.tsx` vector backgrounds
- `Cards.tsx` scroll, portrait, photo, subscribe card · `MapIcons.tsx` map tokens
- `scripts/voice.ts` Fish Audio · `scripts/stills.ts` contact sheets · `scripts/render.ts` chunked render
