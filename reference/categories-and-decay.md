# Categories, new categories, and decay

## 1. Routing an item to a category

For each item, read `_meta/categories.md` and test the item against each category's `belongs` text and `examples`.
Give yourself a confidence from 0 to 1 for the best match, then use the thresholds in `_meta/config.json` (`routing`):

| Confidence | Action |
|---|---|
| >= `file_confidence` (0.8) | File it in that category. |
| >= `review_confidence` (0.5) | File it in the best category AND add `needs_review: true` to its frontmatter. The daily summary lists these so the user can confirm or correct. |
| below that, or no category fits | Put it in `inbox/` as described in section 2. |

Tie-breaks when two categories fit:
- Actionable beats reference: "renew insurance by March" is a **task** (todos) that `relates_to::` the insurance note (finance), not a finance note.
- Durable beats event: "paid 1200 for car insurance today" updates the insurance **entity** note's timeline; it is not a new note.
- If the item is really two things, split it into two notes and link them.
- `_meta/my-rules.md` overrides all of the above.

## 2. When no category fits: the inbox

Create `inbox/<Short Title>.md`:

```yaml
---
type: inbox
candidate_category: travel
confidence: 0.3
created: 2026-10-17
description: "Kyoto: want to see the moss temple, book months ahead"
---
```

- `candidate_category` is your best guess at a NEW category slug that would hold this kind of thing (lowercase, hyphens, general enough to hold many future items: `travel`, not `kyoto-trip-tips`).
  Reuse a slug that other inbox items already use if it fits. Run `cortex status` to see the current candidate slugs.
- If even that is unclear, use `candidate_category: unknown` and ask the user one short question at the end of your reply.

## 3. Creating a new category

A new top-level category is created when ANY of these is true:

1. **Explicit intent.** The user clearly says they want to track a new area ("start tracking my car maintenance", "I want a list of recipes"). Create it immediately.
2. **Repeated demand.** `cortex plan` reports a promotion candidate: at least `new_min_items` (3) inbox items share a `candidate_category`, spread over at least `new_min_distinct_days` (2) different days. Proposed in the daily summary, created when the user approves.
3. **Obvious collection.** The item is clearly the first of a repeating collection that no category could ever hold (e.g. the first recipe when there is no food category). Create it only if you would bet the user adds more within a month. When in doubt, use the inbox instead. A wrong category costs more than a short wait.

**One thing vs many things.** If several items are about ONE thing (the user's car, their flat, their dog, one client),
that is an **entity note**, not a category. Route each item by what it is (a task goes to todos, a cost to finance) and link it to the entity
(`relates_to:: [[Car]]`). The entity lives in `things/` (owned or looked-after things), `people/` (people, orgs) or `projects/`.
A category is only for MANY things of the same kind that the user collects or tracks (recipes, trips, workouts, wines).

Before creating, check it is not a SUBTYPE of an existing category. Recipes are not media; cars are not finance;
but "podcasts" IS media (add `podcast` to media's `types` instead of making a category).
Adding a type to an existing category is always preferred over a new category.

To create one:
1. Append a `## <slug>` block to `_meta/categories.md` with `name`, `belongs` (one clear sentence, including what does NOT belong), `types`, `decay`, `examples` (use the real items that triggered it), and `created: YYYY-MM-DD`.
   For `decay`, use `permanent` if the notes are durable facts the user would never want to lose (health records, documents), `fast` if they are short-lived (a shopping list), otherwise `slow`.
   If the items are repeated events (workouts, meals), the category holds one log note per subject (note-format.md section 6).
2. Run `node .engine/scripts/cortex.mjs reindex`. It creates the folder and the `Hub - <Name>.md` note.
3. Move the matching inbox items into the new folder, converting each to a proper note (note-format.md). Remove the `candidate_category` and `confidence` fields.
4. Log it: `- <date> | create-category | <slug>: <reason / trigger rule number>`.
5. Tell the user in one line: "Created a new category **Car** (3 notes moved from the inbox)."

## 4. Limits that prevent sprawl

| Rule | Value (config) |
|---|---|
| Max folder depth inside a category | `max_depth` (3) |
| Subfolder inside a category | only when `subfolder_min_notes` (7) notes share a clear sub-group. Otherwise use `type:` and tags. |
| Merge proposal | a category created more than `merge_after_days` (60) ago that still has fewer than `merge_below_notes` (3) notes gets proposed for merging into the closest category in the weekly review |
| Never | create empty folders "just in case", or a category for a single item without explicit intent |

## 5. Decay classes

Each category has a `decay` class. Cortex measures a note's age from the LATEST of: `updated`, last time an agent read it (`_meta/access.json`), and `created`.
Each tier is reached after that many days without activity (`_meta/config.json` -> `decay`):

| Class | warm | cold | archive candidate | Used for |
|---|---|---|---|---|
| `permanent` | never | never | never | goals, finance, people, things |
| `slow` | 60 | 180 | 365 | projects, media, ideas, reference |
| `fast` | 7 | 21 | 45 | todos |

Exemptions (never archive candidates): `pinned: true`, `importance: 5`, `status: active` on a project or goal, any note in a `permanent` category.

Special rules:
- **Done todos** are archive candidates `archive_done_after_days` (14) after their `updated` date.
- **Open todos** past their `due` date and untouched for `flag_overdue_after_days` (30) are flagged "still want this?" in the summary, never archived silently.
- **Media** with status `want` past the archive threshold are asked about ("still want to watch X?") rather than archived silently.
- **Journal days** older than `rollup_after_days` (30) are proposed for a monthly rollup in the weekly review.
- **Reading a note refreshes it.** That is why rarely-used but useful notes stay alive.

Archiving NEVER deletes. `cortex archive` moves the note to `archive/<category>/`, sets `status: archived` and `archived: <date>`. Links keep working because names are unique.
The only deletion is a duplicate merge, which moves the extra copy to `.trash/` after its unique content has been merged into the kept note.
