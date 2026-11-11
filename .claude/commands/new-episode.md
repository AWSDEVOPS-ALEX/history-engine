Convert the script at $ARGUMENTS into an episode JSON.

1. Read the script file and its fact sheet (same folder, `.facts.md`) if present.
2. Follow `prompts/episode-json-prompt.md` and `src/schema.ts`. Write `episodes/<same name>.json`.
3. Copy the `mascot` block exactly from `episodes/demo-mali.json`.
4. Run `npm run typecheck` (the JSON is imported by type only at render time, so also run
   `node -e "JSON.parse(require('fs').readFileSync('episodes/<name>.json','utf8'))"` to validate).
5. Run `npm run stills -- episodes/<name>.json` and Read only `out/<name>/stills/sheet.jpg`.
6. Report: segment count, estimated minutes, and any segment that looks empty or cluttered. Fix those.
