---
name: cortex-recall
description: Answer questions from the Cortex vault, such as "what should I watch?", "which card should I use for groceries?", "what am I working on?", "what did Sam recommend?", "what's on my plate this week?". Use whenever the user asks about anything they may have told Cortex before, or asks for a suggestion that depends on their own preferences, lists, goals or history.
---

# Recall

Answer from what is actually in the vault, and say where it came from.

## Steps

1. **Orient.** Read `index.md` to see the categories, then the relevant `Hub - <Name>.md`. Hubs list every note with its description and status.
2. **Filter by structure first.** Most questions are list queries. Match on frontmatter:
   - "what should I watch" → `media/` with `status: want` (and `type: movie` or `show`).
   - "what's due" → `todos/` with status `todo` or `doing`, sorted by `due`, PLUS any note in any category whose
     `due` falls in the period, PLUS recurring dates (`day_of_month`, `yearly`) whose next occurrence falls in it,
     PLUS open todos with no due date or with a `trigger` (listed last, with the trigger).
   - "which card for X" → `finance/` with `type: card` and `status: active`. Read their reward details.
   - "what am I working on / what's going on in my life" → active projects, active goals, active routines, and open todos
     (status `todo`, `doing` or `waiting`) across ALL categories, grouped by goal where links exist. Never answer "nothing"
     just because `projects/` is empty.
   Use grep or ripgrep on frontmatter lines (e.g. `rg -l "^status: want" media/`) rather than reading every file.
3. **Search text second.** For fuzzy questions ("that thing about tax I mentioned"), full-text search the vault with several phrasings, synonyms and likely names. Include `journal/` for when or how something was said.
4. **Follow links.** Read the matching notes and follow `## Related` and wikilinks up to 2 hops for context (e.g. movie → who recommended it, investment → goal it funds).
5. **Archive last.** Only search `archive/` if steps 1-4 found nothing, or the user asks about the past ("what card did I have before?"). Also check Timelines for history.
6. **Answer.**
   - Lead with the answer, personalised. "Watch **Spider-Man Across the Spider-Verse**. You added it on 17 Oct and Sam recommended it."
   - When suggesting from a list, pick 1-3 and say why (recency, who recommended it, mood fit, rating notes), then offer the rest.
   - Cite notes as `[[links]]`.
   - If nothing is stored, say so plainly. Never invent facts about the user. Offer to save the answer if they tell you.
7. **Learn from the question.** If the answer led to a decision ("ok I'll watch it tonight"), that is new information. Use cortex-capture to update the note (e.g. status `in-progress`).

## Notes
- Reading a note marks it as used. Under Claude Code a hook does this automatically. Other agents should run
  `node .engine/scripts/cortex.mjs touch <path> [<path>...]` for notes that were actually useful in the answer. This keeps useful notes from decaying.
- Do not create notes just because the user asked a question. Do not edit notes during recall except via step 7.
