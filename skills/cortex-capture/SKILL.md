---
name: cortex-capture
description: File anything the user tells you (thoughts, facts, plans, todos, money decisions, things to watch, people, ideas) into the Cortex vault without being told where. Use whenever the user's message contains information about their life to remember, a brain dump, a voice transcript, or files dropped in inbox/. Also use when the user corrects where something was filed.
---

# Capture

Turn whatever the user said into well-filed, well-linked notes. The user never says where things go; you decide.
Read `.engine/reference/note-format.md` and `.engine/reference/categories-and-decay.md` once per session before your first capture.

## Steps

### 1. Keep the raw words
Append the user's message verbatim (only messages that carry information; not pure questions, greetings or "apply") to `journal/YYYY-MM-DD.md` (today, local date) under a time heading. Create the file if missing:

```markdown
---
type: journal
created: 2026-10-17
---
# 2026-10-17

## 21:30
I want to watch Spider-Man later, Sam said it's great. Also need to call the bank about the card fee.
```

Never edit earlier entries. This is the source of truth if filing goes wrong. Strip secrets (passwords, PINs, full card or ID numbers) before writing, even here. Replace them with `[redacted]`.

### 2. Split into items
One message often holds several items. List each separately: a fact, a task, a preference, a decision, a person, a thing to watch.
Skip chit-chat and questions addressed to you. Trivial routines ("drink water") stay only in the journal (note-format.md section 8).

### 3. For each item, find before you create
Search the vault for an existing note: `node .engine/scripts/cortex.mjs find --text "<key nouns>" --archive` (matches names, aliases,
descriptions and text). Try 2-3 phrasings and spellings. Without node, grep file names, `aliases:` and text.
Check `archive/` too. If the thing was archived and is now relevant again, move it back to its category and set its status.
- **Found** → update it (note-format.md section 7). Go to step 6.
- **Not found** → continue.

### 4. Route it
Use `_meta/categories.md` with the confidence rules in categories-and-decay.md section 1. `_meta/my-rules.md` overrides.
If nothing fits, follow sections 2-3 there (inbox or new category).

### 5. Create the note
Follow note-format.md exactly: unique file name, all required frontmatter, a summary, a Timeline for entities, and a `## Related` block.
Set `source: "[[YYYY-MM-DD]]"` to today's journal. Apply the entity rule (section 6) to every person, org or thing mentioned:
if it qualifies, create or update that entity note too, and link to it. Apply "purposes are goals" (also section 6):
"for retirement" means a link to the Retirement goal, created if missing.

Money amounts without a currency use the `Currency` in `_meta/core.md`. If that is blank, store the amount as given
and ask once, at the end of your reply, which currency the user uses. Then record it in `core.md`.

If the item changes a core fact (the user's city, job, currency, partner or close family, top priorities),
also update `_meta/core.md` and log it.

### 6. Link it
Apply note-format.md section 5: a hub link, links to all mentioned entities, and 2-3 searched related links where real.

### 7. Record and tidy
- Mark the journal entry processed by appending ` <!-- filed: [[Note A]], [[Note B]] -->` to its time heading line.
- Append one line per created or updated note to `_meta/log.md`.
- Run `node .engine/scripts/cortex.mjs reindex` (updates hubs and index.md). If `node` is unavailable, add the note's line to its hub's catalog section by hand.
- If `_meta/config.json` has `auto_commit: true` and the vault is a git repo, commit: `git add -A && git commit -m "cortex: capture <short summary>"`.

### 8. Reply briefly
Confirm in one or two lines what was stored and where, using links. Example:
"Saved: [[Spider-Man Across the Spider-Verse]] to your watchlist (recommended by [[Sam]]), and a todo [[Call Bank About Card Fee]]."
List anything flagged `needs_review` or put in the inbox, and ask at most ONE clarifying question if something was truly ambiguous.

## Corrections
If the note is already filed the way the user describes, just confirm it ("Already filed as a habit: [[Couch to 5K]]") and change nothing.
When the user says something was filed wrong ("no, that's a work thing", "that's not a goal, it's a project"):
1. Fix it: move or retype the note, fix frontmatter and links, run reindex.
2. Append a line to `_meta/corrections.md` in its format.
3. Log `correction` in `_meta/log.md`.
Do NOT edit `_meta/categories.md` right away for a single correction. The weekly cleanup turns repeated corrections into rule changes.
Exception: if the user explicitly states a rule ("always put X in Y"), add it to `_meta/my-rules.md` now and log `rule-change`.

## Moving an inbox item into a category
Move the file into the category folder (rename it to a proper note name if needed) and rewrite it as a full note:
set `type`, `category`, `status`, `updated`; drop `candidate_category` and `confidence`; add the summary and links.
Never leave a copy in `inbox/`.

## Files dropped in inbox/
Raw files in `inbox/` without `type: inbox` frontmatter came from outside (phone, other apps). Treat their content as a user message:
run steps 1-8 on it, then delete the raw file. Its content is now in the journal.
