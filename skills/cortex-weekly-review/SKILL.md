---
name: cortex-weekly-review
description: Weekly Cortex review that makes the vault smarter. It turns repeated filing corrections into better category rules, proposes category merges, rolls old journal days into monthly summaries, finds concepts that deserve their own note, and surfaces contradictions. Use when the maintenance plan says the weekly review is due and the user agrees, or when the user asks for a weekly review or "improve how you file things".
---

# Weekly review

Same contract as daily maintenance: propose, the user approves, then apply. This is where Cortex learns the user's life.

## 1. Gather
Run `node .engine/scripts/cortex.mjs plan --weekly`. Read `_meta/maintenance-plan.md` (weekly sections),
`_meta/corrections.md` (lines not yet marked applied), and the last 7 days of `_meta/log.md`.

## 2. Build proposals (in this order, skip empty sections)

1. **Rule improvements from corrections.** Group unapplied corrections by pattern. For each group of 2 or more similar corrections,
   draft the exact change: a sharper `belongs` sentence or a new `examples` entry in `_meta/categories.md`, or a new line in `_meta/my-rules.md`.
   Show it as a before/after.
2. **Category merges.** From the plan's `merge_proposals` (tiny categories past their grace period), suggest the closest
   existing category to merge into, or "keep" if it is clearly a real, just-quiet area.
3. **Journal rollups.** For each month listed in `journal_rollup`, plan to write `journal/YYYY-MM Summary.md`.
   It contains what happened, decisions made, and things learned, with links to the notes created that month. Then move the daily files
   to `archive/journal/`. Raw text is never deleted.
4. **Concept gaps.** Search for names or terms that appear in 3 or more notes as plain text or unresolved `[[links]]` but have no note
   (the plan's `unresolved_links` helps). Propose entity or concept notes for them.
5. **Contradictions.** List notes with `contradicts::` lines or conflicting facts you notice. Ask the user which is true.
6. **Stale facts.** Notes whose descriptions say "currently", "now", "this month" etc. and were not updated for 90 days or more. Ask if still true.
7. **Engine improvement ideas** (optional). If you noticed a GENERAL weakness in the Cortex rules themselves (not this user's taste),
   note it in one line. The user may choose to improve the engine (cortex-engine-update skill).

## 3. Present
One compact message, numbered so the user can say "apply 1, 3, 4" or "apply all".

## 4. Apply what was approved
Make the edits, mark applied corrections with `-> applied YYYY-MM-DD`, log `weekly-review` and `rule-change` lines,
run `node .engine/scripts/cortex.mjs reindex` and `node .engine/scripts/cortex.mjs done weekly`, then commit if `auto_commit`.
