# Changelog

## Unreleased
- **Desktop notifications** (Claude Code): new `Stop` and `Notification` hooks (`hook stop|notify`) pop up a native notification when a reply finishes or the agent needs input. Windows toast, macOS Notification Center, Linux `notify-send`. Toggle with `notifications.done` / `notifications.needs_input` in `_meta/config.json`.
- **`cortex shortcut`** (Windows): creates a Desktop **Cortex** icon that opens Claude Code in the vault via Windows Terminal, so capturing doesn't need an editor open.
- One weekly cleanup instead of daily maintenance plus a separate weekly review. It runs at most once every `maintenance.every_days` (7) days and includes the review proposals (corrections into rules, merges, journal rollups). The `cortex-weekly-review` skill is folded into `cortex-maintenance`. `done cleanup` replaces `done daily|weekly` (old forms still accepted).
- New `cortex-onboarding` skill: a first-session interview (name, age, city, currency, work, people, goals, interests, owned things, money setup, reply preferences) that fills `core.md` and seeds notes. `status` and the hook flag new vaults until `done onboarding`.
- `core.md` template gains age, work and an interests section.
- From the onboarding and scale tests:
  - **`cortex find`**: field filters (`=` with comma alternatives, `!=`, `~`, `<`, `>`), relation and link filters (`recommended_by=sam`, `links~sam`), and ranked `--text` search that also covers the journal.
    Text search shows only notes containing every word, and each result line includes the note's extra fields (`size=`, `due=`). Recall uses it instead of reading big hubs.
  - **`cortex graph`**: clusters, isolated notes and most-connected notes. The weekly cleanup lists isolated notes for possible links.
  - **Speed**: the vault is scanned once per command. The cleanup plan on 5,000 notes went from 4.8 s to 0.3 s.
  - `tests/generate-vault.mjs` builds synthetic vaults with planted "needle" facts.
  - Linking rules:
    - Parts link to their whole with typed lines (`part_of`, `supports`, `funds`).
    - Never link the vault owner. Lint warns about self-links.
    - Summaries and descriptions are rewritten when the current state changes.
  - Measurements are log notes. Media notes get `genre`, and favourites are stored as `rating: favourite`.
  - Active routines never decay. Hub catalog lines show `due` and `last`.
  - Onboarding:
    - Greets straight away on a bare "hi".
    - Asks what close people love, which helps with gift ideas.
    - Allows amounts and prices (only account, card and ID numbers are secret).
    - Seeds favourites.
  - Recall:
    - Explains which side of a relation a filter matches.
    - Uses the match count for counting questions.
    - Matches suggestions to the user's taste.
    - Offers to file facts it finds only in the journal.
- From the first 40-input test run:
  - New `things` seed category. One owned thing (car, flat, laptop) is now an entity note that tasks and costs link to, not a new category.
  - "Purposes are goals": "for retirement" creates or links a goal.
  - Exactly one hub link and one relation per target. Typed links wait until the entity note exists, and are upgraded when it is created.
  - Aliases are names, never roles. Substantial habits get their own routine note.
  - Recall for "what am I working on" spans goals, routines and todos.
  - A bare "apply" approves actions only, not unanswered questions.
  - The journal holds information only. `core.md` is updated when core facts change.
  - `CORTEX_TODAY` overrides the clock for tests. The test set now exercises a workouts category promotion instead of car.
- From the second run (about 38/40):
  - Repeated events (workouts, meals) are one log note per subject, not one note per session.
  - Default decay for new categories.
  - An empty plan is closed silently. The plan shows when the weekly review is due, and the weekly review can be skipped.
  - Amounts use the `core.md` currency, or the agent asks once.
  - "What's due" covers due dates in every category.
- From the third run (about 40/41):
  - `status` closes an empty daily plan itself, saving the agent 3 calls a day.
  - Date field conventions: `due`, `day_of_month`, `yearly`, `trigger`.
  - Corrections that match the current filing just get a confirmation.
  - Fixed the example that implied a typed link on a first mention.

## 0.1.0 (2026-10-18)
- Initial engine: AGENTS.md rules, five skills (capture, recall, maintenance, weekly review, engine update),
  note format and category/decay references, `cortex.mjs` CLI (setup, init, status, plan, reindex, lint, archive, restore, touch, done, check-engine, hooks),
  vaults link to the engine via `.engine` (junction/symlink) so notes can never be pushed with the engine,
  Claude Code and Codex hooks, 40-input test set.
