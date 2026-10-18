---
name: cortex-maintenance
description: Daily Cortex vault cleanup. Process inbox drops, promote new categories, archive stale notes, and fix broken links, always as a summary the user approves first. Use when told daily maintenance is due (by a hook message or the session-start check in AGENTS.md), or when the user says "clean up", "tidy the brain", "apply", or "skip" in reply to a cleanup summary.
---

# Daily maintenance

The script does all counting and date math. You make judgement calls and talk to the user.
Nothing is changed until the user approves. That is the contract.

## 1. Build the plan
Run `node .engine/scripts/cortex.mjs plan` (the hook may already have done this today).
It writes `_meta/maintenance-plan.json` and a readable `_meta/maintenance-plan.md`. Read the `.md`.
If `node` is unavailable, do a reduced manual pass: list `inbox/`, and list `todos/` notes with status `done` updated more than 14 days ago.

If the plan proposes nothing (it says "Nothing to do"), run `node .engine/scripts/cortex.mjs done daily` silently and say nothing about it,
unless the plan says the weekly review is due (see the end of this skill).

## 2. Don't block the user
If the user's message was a real request, handle it FIRST, then add the summary at the end of the same reply.
If the user only opened the session or said hi, show the summary right away.

## 3. Show the summary
Keep it short and scannable. Only include sections that have items:

```
**Daily cleanup** (nothing changes until you say so)
- Inbox: 3 items to file → Car Service Due (new category **car**?), Gym Timing (→ todos), Book Idea (→ ideas)
- New category: **car**, 3 inbox items over 4 days. Create it?
- Archive 4: Buy Milk (done 20d), Call Plumber (done 16d), Old Meme Link (cold 400d), ...
- Questions: Still want to watch *Inception*? (on the list 13 months) · "Fix bike" is 35 days overdue: keep, reschedule or drop?
- Needs review: [[Gym Membership]] filed in finance at 0.6 confidence. Right place?
- Lint: 2 broken links (will fix), 1 note missing a description (will write it)

Reply **apply**, **apply except <items>**, answer the questions, or **skip** (ask again tomorrow).
```

For inbox items, propose a destination for each (run the cortex-capture routing in your head). Do not file yet.
Cap the summary at the plan's `max_items_per_run` items. Mention "N more deferred to next run" if the plan says so.

## 4. On "apply" (or partial apply)
A bare "apply" approves every proposed ACTION (archive, inbox filing, new categories, lint fixes). It does not answer
questions: unanswered questions and unconfirmed "needs review" items stay unchanged and are asked again next run.
Do only what was approved:
- **Archive**: `node .engine/scripts/cortex.mjs archive <path> [<path>...]`. The script moves the files and sets status and date.
- **Inbox**: file each approved item with the cortex-capture steps (route, note, link). Raw drops are added to the journal first.
- **New category**: follow `.engine/reference/categories-and-decay.md` section 3.
- **Questions**: apply the answers (status `dropped`, new `due`, keep, etc.) and add a Timeline line.
- **Needs review**: on confirmation, remove `needs_review`. On correction, move it and log to `_meta/corrections.md`.
- **Lint fixes**: fix broken links (find the intended target by search; if none exists, unlink to plain text), and write missing descriptions. Never delete notes to fix lint.
Then run `node .engine/scripts/cortex.mjs reindex` and `node .engine/scripts/cortex.mjs done daily`,
log `maintenance` in `_meta/log.md` with counts, commit if `auto_commit`, and reply with a one-line result.

## 5. On "skip"
Run `node .engine/scripts/cortex.mjs done daily --skipped`. Nothing else changes. Tomorrow's plan will include today's items again.

## 6. If the user ignores the summary
Do nothing. The plan stays. The next session (or tomorrow) asks again. Never apply silently.

## Weekly review
If the plan says the weekly review is due, add one line to the summary: "Weekly review is due too. Run it now, or later?"
On yes, use the cortex-weekly-review skill. On "later", "not now" or no answer, do not ask again in this session.
On "skip", run `node .engine/scripts/cortex.mjs done weekly --skipped` (asks again in 7 days).
