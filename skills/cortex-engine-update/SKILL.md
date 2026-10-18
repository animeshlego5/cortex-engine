---
name: cortex-engine-update
description: Change the Cortex engine itself (the generic rules, skills, scripts and templates in .engine/) so every Cortex user benefits, or regenerate the vault after the engine changed. Use ONLY when the user explicitly asks to improve Cortex's rules or behaviour in general, or says the engine was updated. Never use it for the user's own notes, categories or personal rules.
---

# Engine update

The vault has two layers:
- `.engine/` is a link to the user's `cortex-engine` git repo, which they publish on GitHub themselves. It holds generic rules, skills, scripts and templates.
- Everything else is the user's private data, including `_meta/categories.md`, `_meta/my-rules.md` and `_meta/config.json`. It never leaves this machine.

## Decide which layer a change belongs to
Ask: "Would this change help EVERY Cortex user, regardless of their life?"
- Yes (a clearer routing procedure, a relation type everyone needs, a script bug fix) → engine.
- No (a new category, this user's naming preferences, their thresholds) → `_meta/` files. Do not touch `.engine/`.
Never put personal data, real names, or examples from the user's life inside `.engine/`. Use generic examples (Sam, Alex, "a credit card").

## Edit the engine
1. Change files inside `.engine/` only (skills in `.engine/skills/`, rules template in `.engine/templates/AGENTS.md`, references, scripts).
   Never edit the generated copies at the vault root (`AGENTS.md`, `CLAUDE.md`, `.claude/skills/`, `.agents/skills/`).
2. Add a line to `.engine/CHANGELOG.md` under "Unreleased".
3. Run `node .engine/scripts/cortex.mjs setup` to regenerate the vault's copies, then `node .engine/scripts/cortex.mjs lint`.
4. Do NOT commit or push the engine. Tell the user which engine files changed and remind them to review, commit and push from
   their `cortex-engine` folder. Its pre-push check (`node scripts/cortex.mjs check-engine`) blocks pushes that contain vault data or secrets.

## After the user pulled engine updates
Run `node .engine/scripts/cortex.mjs setup` (regenerates AGENTS.md, CLAUDE.md, skills and hooks; never touches `_meta/` or notes),
then read `.engine/CHANGELOG.md` and summarise what changed in 2-3 lines.
