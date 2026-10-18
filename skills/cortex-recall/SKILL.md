---
name: cortex-recall
description: Answer questions from the Cortex vault, such as "what should I watch?", "which card should I use for groceries?", "what am I working on?", "what did Sam recommend?", "what's on my plate this week?". Use whenever the user asks about anything they may have told Cortex before, or asks for a suggestion that depends on their own preferences, lists, goals or history.
---

# Recall

Answer from what is actually in the vault, and say where it came from.

## Steps

Search with `node .engine/scripts/cortex.mjs find ...`. It prints one line per note (path · status · updated · description · other fields like `due=` or `size=`),
so you never have to read whole folders or big hubs. Examples:
- `find media status=want type=movie`: the watchlist
- `find todos status!=done "due<2026-11-20"`: open todos due before a date
- `find finance type=card status=active`: active cards
- `find recommended_by=sam`: everything Sam recommended (any relation name works: `funds~house`, `supports="run a marathon"`)
- `find links~sam`: every note that links to Sam in any way
- Relation filters match the note that HOLDS the link: "what funds the house goal?" is `find finance funds~house`, not a search in `goals/`.
- For counts, read the "(N matches)" footer; for full lists use `--limit <N>`.
- `find todos status=todo,doing`: comma = OR
- `find --text "boiler plumber"`: ranked full-text search across all notes AND the journal
- add `--archive` to include archived notes, and `--limit 50` for more lines
If `node` is missing, use `index.md`, the hubs and grep instead.

1. **Orient.** Read `index.md` to see the categories. Read a `Hub - <Name>.md` only if the category is small (under about 150 notes). Otherwise use `find`.
2. **Filter by structure first.** Most questions are list queries. Match on frontmatter:
   - "what should I watch" → `media/` with `status: want` (and `type: movie` or `show`).
   - "what's due" → `todos/` with status `todo` or `doing`, sorted by `due`, PLUS any note in any category whose
     `due` falls in the period, PLUS recurring dates (`day_of_month`, `yearly`) whose next occurrence falls in it,
     PLUS open todos with no due date or with a `trigger` (listed last, with the trigger).
   - "which card for X" → `finance/` with `type: card` and `status: active`. Read their reward details.
   - "what am I working on / what's going on in my life" → active projects, active goals, active routines, and open todos
     (status `todo`, `doing` or `waiting`) across ALL categories, grouped by goal where links exist. Never answer "nothing"
     just because `projects/` is empty.
   Use `find` with field filters for these.
3. **Search text second.** For fuzzy questions ("that thing about tax I mentioned"), run `find --text` with 2-3 phrasings, synonyms and likely names.
   It covers `journal/`, which holds the raw words, so it answers "when did I say..." and facts that were never filed as notes.
4. **Follow links.** Read the matching notes and follow `## Related` and wikilinks up to 2 hops for context (e.g. movie → who recommended it, investment → goal it funds).
5. **Archive last.** Only search `archive/` if steps 1-4 found nothing, or the user asks about the past ("what card did I have before?"). Also check Timelines for history.
6. **Answer.**
   - Lead with the answer, personalised. "Watch **Spider-Man Across the Spider-Verse**. You added it on 17 Oct and Sam recommended it."
   - When suggesting from a list, pick 1-3 and say why (recency, who recommended it, fit with `## Interests and taste` in `_meta/core.md`, `genre`, favourites), then offer the rest.
   - If the answer was found only in `journal/` (never filed as a note), answer it, then offer to file it properly.
   - Cite notes as `[[links]]`.
   - If nothing is stored, say so plainly. Never invent facts about the user. Offer to save the answer if they tell you.
7. **Learn from the question.** If the answer led to a decision ("ok I'll watch it tonight"), that is new information. Use cortex-capture to update the note (e.g. status `in-progress`).

## Notes
- Reading a note marks it as used. Under Claude Code a hook does this automatically. Other agents should run
  `node .engine/scripts/cortex.mjs touch <path> [<path>...]` for notes that were actually useful in the answer. This keeps useful notes from decaying.
- Do not create notes just because the user asked a question. Do not edit notes during recall except via step 7.
