# Script → episode JSON

Used by `/new-episode` in Claude Code (or paste into any Claude chat with your finished script).
It converts a fact-checked script into the JSON the engine renders. It never adds or changes facts.

---

Convert this finished narration script into an episode file. Keep the narrator's wording; only split it.
Types are in `src/schema.ts`. Everything is drawn in code; there are no image prompts.

Top level: `title`, `fps: 30`, `mascot` (copy unchanged from `episodes/demo-mali.json`), `narratorVoice`,
`cast`, `segments`.

`cast`: one entry per skit character, `id` in CAPS_SNAKE, `voice: "VOICE_<ID>"`, and a `look` built from:
skin, robe, trim (hex) · hat: none | crown | turban | cap | tallhat | hood | helmet | mitre · hatColor ·
beard: none | short | long · beardColor · glasses · prop (right hand): none | lantern | staff | scroll | sword | coin ·
staff (left hand): none | plain | chronicler · satchel · belt (hex) · pattern: none | stripes | diamonds · sandals.

Segments:

1. 8–20 spoken words each (3–8 s). `id` = `cNN-sNN`; new chapter at each new era or place.
2. `type`: `narration`, `skit` (one character line, `speaker` = cast id), `cta` (+ short `ctaText`).
3. `visual.kind`:
   - **map** for any place, border, journey, river, trade or war. `from`/`to` camera (lon, lat, zoom:
     1 world, 3 region, 6 country, 12+ battlefield), or `keys` for several stops. Next map starts where the
     last one ended. Every map gets 3–6 `events`, timed across the line at ~2.5 words per second:
     `move` (icon camel | ship | soldier | horse, `count`, `dur`, optional `label`), `flow` (trade line),
     `battle`, `fill` (country names as in Natural Earth, `stagger`), `border`, `scatter` (icon, n, spread),
     `icon` (gold, salt, crown, book, mosque, tent, house, scroll, fire…, optional `label`),
     `label` (geo-anchored handwriting), `pulse`, `arrow`, `counter`. Plus `rivers`, `cities`, `rulers`.
   - **gray** + `icon` (coins, bulb, question, mound, crown, camel, book) for ideas, numbers, jokes.
   - **scene** for skits: `set` (palace, study, desert, fields, night-city, sky, village, sea, battlefield,
     market) + `cast` positions (x 20–80, `pose`, `flip`).
   - **set** for a mood shot with narration (add `mood`: night | candle).
   - **portrait** / **photo** for real public-domain images: write `archive/TODO_<what>.jpg`.
   - **scroll** for dates at chapter breaks (`roll: "close"` on the last segment of a chapter) or a quote.
4. `date` badge whenever the sentence is anchored in time.
5. `mascot` on most narration segments: `pose` (talk | point | angry | confused | happy | shrug) and
   `poses: [{ t, pose }]` when the line turns. None in skits, scrolls, portraits, photos.
6. `labels`: 1–2 handwritten words the narrator stresses (x/y in %, keep x < 70 when the mascot is right).
7. Never state a contested claim as fact on screen; hedge as the script hedges.

Return only the JSON.
