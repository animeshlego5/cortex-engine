# Note format

Every note an agent creates in a category folder follows this format. `cortex lint` checks it.

## 1. File name

- The file name IS the note's identity. Obsidian links resolve by file name, so **file names must be unique across the whole vault**.
- Use the natural title in Title Case: `Spider-Man Across the Spider-Verse.md`, `Priya Sharma.md`, `Run a Half Marathon.md`.
- Strip characters that break links or file systems: `: / \ ? * " < > | # ^ [ ]`. Replace `:` with ` -`.
- If the name is taken by a different thing, add a short disambiguator in parentheses: `Dune (book).md`, `Dune (2021 film).md`.
- People: full name if known, else the name the user uses (`Alex (manager).md` if ambiguous).
- Ideas and reflections: a short claim, not a topic. Good: `Mornings Are My Focus Time.md`. Bad: `Productivity.md`.
- Never put dates in category note names (dates belong in frontmatter). Only `journal/` uses dated names.

## 2. Frontmatter

```yaml
---
type: movie
category: media
description: "Spider-Man animated sequel the user wants to watch; recommended by Sam"
status: want-to-watch
created: 2026-10-17
updated: 2026-10-17
aliases: ["Across the Spider-Verse"]
tags: [animation]
source: "[[2026-10-17]]"
---
```

Required on every note:

| Field | Rule |
|---|---|
| `type` | One of the `types` listed for the category in `_meta/categories.md`. |
| `category` | The category slug. Must match the top-level folder the note lives in. |
| `description` | One sentence, written as a **search snippet**: what it is and why it matters to the user. Hubs are built from this. Never just repeat the title. |
| `status` | Current state (see table below). |
| `created` | `YYYY-MM-DD`, set once. |
| `updated` | `YYYY-MM-DD`, set on every meaningful edit. |

Optional: `aliases` (other names the user may use, important for dedup), `tags` (0-5, lowercase, kebab-case),
`source` (link to the journal day it came from), `pinned: true` (never decays, never auto-archived),
`due: YYYY-MM-DD` (todos, projects), `importance: 1-5` (default 3; 5 = never decays).
Add any type-specific fields you need (e.g. `rating`, `amount`, `platform`, `recommended_by`), lowercase snake_case.
Put wikilinks in frontmatter as quoted strings: `goal: "[[Run a Half Marathon]]"`.

Common statuses (use these before inventing new ones):

| Types | Statuses |
|---|---|
| task | `todo`, `doing`, `waiting`, `done`, `dropped` |
| routine | `active`, `paused`, `dropped` |
| project | `idea`, `active`, `paused`, `done`, `dropped` |
| goal | `active`, `achieved`, `abandoned` |
| movie, show, book, game, podcast, video, article, music | `want`, `in-progress`, `done`, `dropped` |
| person, org | `active`, `past` |
| account, card, investment, loan, insurance, subscription | `active`, `closed` |
| decision | `decided`, `revisit`, `reversed` |
| everything else | `active` |
| any note | `archived` (set only by cleanup) |

## 3. Body

```markdown
# Spider-Man Across the Spider-Verse

Animated sequel. Sam says the visuals are the best of any Spider-Man film.

## Timeline
- 2026-10-17: Added to watchlist, recommended by [[Sam]] (source: [[2026-10-17]])

## Related
- recommended_by:: [[Sam]]
- part_of:: [[Hub - Media]]
```

- Start with a 1-3 sentence summary in the user's terms.
- `## Timeline` is **required for entity notes** (people, orgs, cards, accounts, investments, goals, projects) and optional otherwise.
  It is append-only, newest at the bottom: `- YYYY-MM-DD: <what changed or was learned> (source: [[YYYY-MM-DD]])`.
  Never rewrite or delete timeline lines. The frontmatter and summary show the CURRENT state; the timeline shows history.
  This is how "what card did I have before?" stays answerable.
- `## Related` holds typed links, one per line, in Obsidian's `key:: [[Target]]` form.
- Mention other notes in prose with `[[wikilinks]]` too. Every wikilink becomes an edge in Obsidian's graph.

## 4. Relation types (the only keys allowed in `## Related`)

| Key | Use when | Example |
|---|---|---|
| `part_of` | This belongs to a bigger thing (category hub, project, goal) | task `part_of:: [[Home Server]]` |
| `depends_on` | This cannot progress until the target does | `depends_on:: [[Buy Raspberry Pi]]` |
| `supports` | This helps achieve the target (habit or project serving a goal) | project `supports:: [[Get Fit]]` |
| `funds` | Money item that pays for a goal or project | investment `funds:: [[Retirement]]` |
| `supersedes` | This replaces an older note or fact | `supersedes:: [[Old Credit Card]]` |
| `contradicts` | This conflicts with the target and the user has not resolved it | `contradicts:: [[Mornings Are My Focus Time]]` |
| `recommended_by` | A person or source suggested this | `recommended_by:: [[Sam]]` |
| `decided_in` | The decision note that explains why this exists | `decided_in:: [[Chose Index Funds Over Stocks]]` |
| `relates_to` | Genuinely related, none of the above fit (use sparingly) | `relates_to:: [[Kitchen Renovation]]` |

The vault's `_meta/config.json` holds this list (`relation_types`). Do not invent new keys. If a new one keeps being needed, propose it in the weekly review.

## 5. Linking rules

Every new or updated note must have:

1. **One hub link**: `part_of:: [[Hub - <Category Name>]]`, unless the note is already `part_of` a project or goal in the same category.
2. **A link to every entity it mentions** that has its own note (people, orgs, cards, projects, goals). Search for the entity first.
3. **2-3 links to genuinely related notes**, found by searching the vault, each with a relation type. Zero is fine if nothing is truly related. Never invent links to look connected.

And:

- **Cross-category connections go through entities.** A movie Sam recommended and a job tip from Sam are connected because both link `[[Sam]]`. Do not link the movie to the job tip directly.
- **One fact, one place.** If a fact belongs to another note (Sam's phone number belongs in `Sam.md`), put it there and link to it. Do not copy it.
- **Links go one way.** Write the link on the note that is doing the relating (the investment `funds::` the goal; the goal does not list its investments). Obsidian shows backlinks automatically, and agents find reverse links by searching for `[[Target]]`. Never add a reverse line just to make the graph symmetric.
- **Forward links are fine.** `[[Someone Not Yet Noted]]` in prose is allowed. It becomes a real note when the entity rule (below) triggers.
- **Typed links must resolve.** A `## Related` line must point at an existing note. Lint reports broken typed links as errors.

## 6. Entity or plain note?

Create a separate **entity note** (person, org, card, account, investment, project, goal, place) when ANY is true:
- it is mentioned for the **second time** on a different day, or
- the user states a fact about it that can **change over time** (role, balance, status, address, plan), or
- the user will **act on it** (a contact to call, a card to pay, a subscription to cancel).

Otherwise, a one-off mention stays a plain `[[wikilink]]` (or plain text) inside the note that mentions it. Do not create empty stubs.

## 7. Updating instead of creating

Before creating any note, search for it (file names, `aliases`, and full text for the key words). If it exists:
- Update its frontmatter to the new current state and bump `updated`.
- Append a `## Timeline` line describing the change.
- Add any new aliases the user used.
- Never overwrite history. If the new fact contradicts an old one without being a clear update (e.g. two different birthdays), keep both, add `contradicts::`, and ask the user.

## 8. Things that never become notes

- **Secrets**: passwords, PINs, OTPs, CVVs, full card or account numbers, government ID numbers, recovery codes. Store at most the last 4 digits and "see password manager".
- **Trivial routines** ("drink water", "take vitamins", "stretch"). They go in the day's journal entry only. If the user wants a recurring reminder, add ONE line to the single `todos/Routines.md` note (type `routine`).
- **Chit-chat** and questions to the agent. Answers to questions are not stored unless the user asks, or the answer produced a durable fact worth keeping.
