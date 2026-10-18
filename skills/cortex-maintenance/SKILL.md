---
name: cortex-maintenance
description: The weekly Cortex cleanup. Tidies the vault (inbox, new categories, stale notes, broken links) and reviews it (turns repeated corrections into better rules, merges tiny categories, rolls old journal days into monthly summaries), always as ONE summary the user approves first. Use when told the cleanup is due (by a hook message or the session-start check in AGENTS.md), or when the user says "clean up", "tidy the brain", "review", "apply" or "skip" in reply to a cleanup summary.
---

# Weekly cleanup

Runs at most once every `maintenance.every_days` days (default 7, in `_meta/config.json`). Between runs, never suggest a cleanup
unless the user asks for one. The script does the counting and date math. You make the judgement calls and talk to the user.
Nothing changes until the user approves. That is the contract.

## 1. Build the plan
Run `node .engine/scripts/cortex.mjs plan`. It writes `_meta/maintenance-plan.json` and a readable `_meta/maintenance-plan.md`. Read the `.md`,
then `_meta/corrections.md` (lines not marked applied) and the last week of `_meta/log.md`.
If the plan says "Nothing to do", run `node .engine/scripts/cortex.mjs done cleanup` and say nothing about it.
If `node` is unavailable, do a reduced manual pass: list `inbox/`, and list `todos/` notes with status `done` updated more than 14 days ago.

## 2. Don't block the user
If the user's message was a real request, handle it FIRST, then add the summary at the end of the same reply.
If the user only opened the session or said hi, show the summary right away.

## 3. Prepare proposals
**Tidy** (from the plan):
- Inbox items: propose a destination for each (cortex-capture routing). Do not file yet.
- Category promotions, needs-review items, questions (overdue todos, stale wishlist items), archive candidates, lint errors.

**Review** (your judgement):
1. **Rule improvements from corrections.** Group unapplied corrections by pattern. For each group of 2 or more similar ones, draft the exact change:
   a sharper `belongs` sentence or a new `examples` entry in `_meta/categories.md`, or a line in `_meta/my-rules.md`.
2. **Category merges.** For the plan's small categories, suggest the closest category to merge into, or "keep" if it is clearly real but quiet.
3. **Journal rollups.** For each month in the plan, write `journal/YYYY-MM Summary.md` (what happened, decisions, things learned, links to that month's notes),
   then move the daily files to `archive/journal/`. Raw text is never deleted.
4. **Concept gaps.** Names in the plan's "linked from several notes" list, or terms you see in 3+ notes with no note of their own. Propose a note.
5. **Contradictions and stale facts.** Notes with `contradicts::` lines, and notes saying "currently" or "now" that were not updated for 90+ days. Ask which is true.

## 4. Show ONE summary
Short, numbered, only sections that have items:

```
**Weekly cleanup** (nothing changes until you say so)
1. Inbox: Car Service Due → todos (linked to [[Car]]), Book Idea → ideas
2. New category **workouts**: 3 inbox items over 4 days
3. Archive 4: Buy Milk (done 20d), Call Plumber (done 16d), ...
4. Rule fix: you moved 2 gym notes out of projects → add "gym routines" to the todos examples
5. Roll up September's 22 journal days into one summary
Questions: Still want to watch *Inception*? (on the list 13 months) · "Fix bike" is 35 days overdue: keep, reschedule or drop?

Reply **apply**, **apply 1,3**, **apply except 2**, answer the questions, or **skip** (ask again next week).
```

Cap it at the plan's `max_items_per_run` items. Mention "N more next week" if the plan deferred some.

## 5. On "apply" (all or some)
A bare "apply" approves every numbered item. It does not answer questions: unanswered questions and unconfirmed "needs review" items stay as they are and come back next time.
- **Archive**: `node .engine/scripts/cortex.mjs archive <path> [<path>...]` (moves the notes and sets their status and date).
- **Inbox**: file each item with the cortex-capture steps. Raw drops are added to the journal first.
- **New category**: `.engine/reference/categories-and-decay.md` section 3.
- **Rule fixes**: edit `_meta/categories.md` or `_meta/my-rules.md`. Mark the corrections they came from with `-> applied YYYY-MM-DD`. Log `rule-change`.
- **Rollups, merges, concept notes**: as proposed. Merges move notes, update `category`, and remove the old block from `categories.md`.
- **Answers to questions**: apply them (status `dropped`, a new `due`, keep...) with a Timeline line.
- **Lint fixes**: fix broken links (find the intended target by search; if none, unlink to plain text) and write missing descriptions. Never delete notes to fix lint.
Then run `node .engine/scripts/cortex.mjs reindex` and `node .engine/scripts/cortex.mjs done cleanup`, log `maintenance` with counts in `_meta/log.md`,
commit if `auto_commit`, and reply with a one-line result.

## 6. On "skip" or no answer
"skip": run `node .engine/scripts/cortex.mjs done cleanup --skipped`. Nothing changes, and it comes back next week with the same items.
No answer: change nothing and do not raise it again this session. It is offered again in the next session.
