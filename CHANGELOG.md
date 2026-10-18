# Changelog

## Unreleased
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
