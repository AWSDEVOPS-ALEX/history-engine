# History Engine

Remotion project for an Ethos-style faceless history channel. One episode JSON drives everything:
a guide character with a lantern staff, busy animated maps (caravans, ships, armies, battles, trade
flows, territory fills), handwritten kinetic text, gray explainer cards, cartoon skits, scrolls and
public-domain archive images. Every picture is drawn in code. Voice comes from Fish Audio.

```
your script + fact sheet
  → /new-episode (Claude Code)     → episodes/<ep>.json
  → npm run voice                   → Fish Audio clips, real durations written back
  → npm run stills / /check         → contact sheet to review
  → npm run render                  → out/<ep>.mp4, rendered on your machine
```

## Set up on your computer (once)

1. Install **Node.js 20 LTS** (nodejs.org) and **ffmpeg** (macOS: `brew install ffmpeg`;
   Windows: `winget install ffmpeg`).
2. Unzip this folder somewhere permanent, open a terminal in it, run `npm install`.
3. Install Claude Code: `npm install -g @anthropic-ai/claude-code`, then run `claude` in this folder
   and sign in. It reads `CLAUDE.md` automatically, so it already knows the project.
4. Create `.env` (or set in your shell): `FISH_API_KEY=...`
5. Test: `npx remotion studio` opens the demo in your browser.

## Day-to-day in Claude Code

| Type in `claude` | What happens |
| --- | --- |
| `/new-episode scripts-in/ottoman.md` | Script → episode JSON → contact sheet → fixes |
| `/map-pass episodes/ottoman.json` | Adds 3–6 timed map events to every map segment |
| `/check episodes/ottoman.json c03-s01 c03-s02` | Stills of those segments, fixes overlaps |
| `npm run voice -- episodes/ottoman.json` | Fish Audio voice for every segment |
| `npm run render -- episodes/ottoman.json` | Full render on your machine, all CPU cores |

You can run the `npm run` commands yourself in any terminal; they use no Claude tokens at all.

## Rendering speed

Renders run on your own CPU, one chapter at a time, using all but one core. As a rough guide, an
8-core laptop does a 50-minute episode in about 1.5–3 hours. A crash only loses one chapter: re-run
the same command and finished chapters are skipped. Watch live with `npx remotion studio`.

## What you can put in an episode

See `src/schema.ts` (the full format) and `episodes/demo-mali.json` (a worked example).

| Visual | Use for |
| --- | --- |
| `map` + `events` | Places, journeys, trade, wars. Events: `move`, `flow`, `battle`, `fill`, `border`, `scatter`, `icon`, `label`, `pulse`, `arrow`, `counter` |
| `gray` + icon | Ideas, numbers, jokes |
| `scene` | Skits: set + 2–3 characters, line shown above the speaker |
| `set` | Mood shots: palace, study, desert, fields, night-city, sky, village, sea, battlefield, market |
| `portrait` / `photo` | Public-domain paintings and archive photos (`public/archive/`) |
| `scroll` | Dates at chapter breaks, quotes |

## Satellite maps (run once)

```bash
npm run satellite                        # world + medium detail, ~150 MB download
npm run satellite -- --hi -20,0,45,35    # sharper close-ups for one region (lon/lat box)
```
Imagery: NASA Blue Marble Next Generation (public domain). Until you run it, maps use the painted look.

## Notes

- **Maps use modern country borders** for `fill`. For accurate historical empires, add a GeoJSON
  outline (next upgrade).
- **Music:** licensed track at `public/music/bed.mp3`, set `"music": "music/bed.mp3"`.
- **Fish Audio call** (`scripts/voice.ts`) follows the public API and was not tested from here; if your
  existing code has a working call, paste it into `tts()`.
