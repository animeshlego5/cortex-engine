# Cortex routing test set

Feed these to an agent running in a FRESH test vault, one day block at a time, in order. Use `--vault` or a throwaway `cortex init`.
After each day, check the vault against "Expect". After all days, run `cortex lint` (expect 0 errors) and the recall questions at the end.
Simulate days by telling the agent "Today is <date>" before each block.

Scoring: 1 point per input whose expectation is fully met. Target: 36/40 or more on every supported agent.

## Day 1 (2026-11-02)

| # | Input | Expect |
|---|---|---|
| 1 | I want to watch Spider-Man Across the Spider-Verse later, Sam said it's amazing | `media/` movie, status `want`; `people/Sam.md` NOT created yet (first mention) OR plain `[[Sam]]` link; `recommended_by` only if Sam note exists |
| 2 | remind me to call the dentist tomorrow | `todos/` task, `due: 2026-11-03` |
| 3 | drink water | journal only. No note created |
| 4 | I got a new credit card, the Atlas Rewards card, 5% back on groceries, annual fee 99, statement on the 12th | `finance/` card, status `active`, fee/reward fields, Timeline line |
| 5 | my card number is 4111 1111 1111 1111 and cvv 123 | NOT stored anywhere (journal shows `[redacted]`), agent says it won't store it, offers last 4 |
| 6 | idea: an app that splits restaurant bills by voice | `ideas/` idea with a claim-style title |
| 7 | I want to run a half marathon next year | `goals/` goal, status `active` |
| 8 | started a couch-to-5k plan this week, three runs a week | `projects/` project (or routine in todos) that `supports:: [[Run a Half Marathon]]` |

## Day 2 (2026-11-03)

| # | Input | Expect |
|---|---|---|
| 9 | called the dentist, appointment is on the 20th | task #2 → `done`; new task or note for the appointment with `due: 2026-11-20` (or the same task updated) |
| 10 | Sam also recommended the book Project Hail Mary | `media/` book; `people/Sam.md` created now (second mention) and BOTH media notes link `recommended_by:: [[Sam]]` |
| 11 | my car is due for service at 30,000 km, it's at 27,500 now | `inbox/` with `candidate_category: car` (no car category yet), OR new category only if agent judges explicit intent (it should NOT) |
| 12 | putting 200 a month into a global index fund for retirement | `finance/` investment + `goals/` Retirement goal (new) with `funds::` link from the investment |
| 13 | my manager Alex prefers written updates over calls | `people/` person Alex with the preference |
| 14 | finished the first week of couch to 5k, legs sore | updates the project note Timeline, no new note |

## Day 3 (2026-11-05)

| # | Input | Expect |
|---|---|---|
| 15 | need new tyres before winter, front ones are worn | `inbox/` `candidate_category: car` (2nd item) |
| 16 | what should I watch tonight? | recall: recommends Spider-Man Across the Spider-Verse, mentions Sam. No notes created |
| 17 | watched Spider-Verse, 9/10, the animation is unreal | movie → status `done`, `rating: 9`, Timeline line |
| 18 | the router admin page is 192.168.1.1 | `reference/` fact |
| 19 | Priya's birthday is 12 May | `people/Priya.md` (stateful fact → entity) with birthday field |
| 20 | I think I do my best work before 11am | `ideas/` reflection, claim-style title |
| 21 | cancelled my StreamFlix subscription, too expensive | `finance/` subscription, status `closed`, with the reason. Creates the note if missing |

## Day 4 (2026-11-09)

| # | Input | Expect |
|---|---|---|
| 22 | car insurance renews on 1 Feb, currently paying 640 a year | `inbox/` car (3rd item, 3rd distinct day) OR `finance/` insurance. Either is acceptable; finance insurance is preferred |
| 23 | the mechanic said the brake pads have about 5,000 km left | `inbox/` car. The next `cortex plan` must propose promoting **car** (3+ items, 2+ days) |
| 24 | actually that bill splitting idea, I'd call it SplitSpeak | updates the existing idea (alias or title), no new note |
| 25 | Alex is now my skip-level, my new manager is Jordan | Alex: Timeline line (role change, NOT overwritten history); Jordan: new person note; Alex's frontmatter role updated |
| 26 | goal update: I want to do the half marathon in under 2 hours | goal updated (target), Timeline line |
| 27 | I want to start tracking recipes I like, first one: shakshuka with feta | new category `recipes` created IMMEDIATELY (explicit intent), logged, one note |

## Day 5 (2026-11-10): maintenance and corrections

| # | Input | Expect |
|---|---|---|
| 28 | (first message of the day) hi | maintenance summary shown: car promotion proposed, inbox listed. Nothing applied yet |
| 29 | apply | `car/` category created with belongs/examples from the real items, inbox items moved and converted, `cortex done daily` run, log lines |
| 30 | no, the couch to 5k thing is a habit, not a project | moved/retyped (e.g. todos routine), correction logged in `_meta/corrections.md` |
| 31 | always file anything about running under my half marathon goal | `_meta/my-rules.md` gets the rule; `rule-change` logged |
| 32 | what do I need to do this week? | recall lists open todos with due dates (dentist appt on the 20th etc.) |

## Day 6 (2026-11-14)

| # | Input | Expect |
|---|---|---|
| 33 | Jordan recommended the podcast Acquired | `media/` podcast, `recommended_by:: [[Jordan]]` |
| 34 | my sister Maya is moving to Lisbon in March | `people/Maya.md` (stateful), Timeline line; maybe `_meta/core.md` close people |
| 35 | which card should I use for groceries? | recall: Atlas Rewards (5% groceries) |
| 36 | what did Sam recommend? | recall: Spider-Verse (watched, 9/10) and Project Hail Mary (want) |
| 37 | I'm thinking of switching from the index fund to a bond fund, not sure | `finance/` decision with status `revisit` (or idea) linked to the investment. Investment NOT changed |
| 38 | tyres done, 380 for all four | car tyres note → done, cost recorded, no duplicate note |
| 39 | random thought: should I learn the guitar? | `ideas/` (not goals: not committed yet) |
| 40 | what am I working on right now? | recall: active projects + goals, mentions half marathon goal |

## Final checks
- `cortex lint` → 0 errors.
- No full card number anywhere (`grep -r "4111" .` → nothing outside this test file).
- Every note in a category has all required frontmatter and a hub link.
- `_meta/log.md` has a line for every change. `_meta/categories.md` has `car` and `recipes` with real examples.
- The Obsidian graph shows Sam connected to two media notes, and the investment connected to the Retirement goal.
