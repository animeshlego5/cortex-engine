# Categories

This file is the single source of truth for where things go. Agents read it before filing anything.
It belongs to YOU (it lives in your vault, not the engine) and grows as Cortex learns your life.

Format rules (the scripts parse this file, keep the shape):
- One `## <slug>` heading per category. The slug is the folder name: lowercase, hyphens, no spaces.
- Under it, `- key: value` lines. Required keys: `name`, `belongs`, `types`, `decay`.
- `decay` is one of: `permanent`, `slow`, `fast` (see `_meta/config.json` for the day thresholds).
- `types` lists the allowed `type:` values for notes in this category, comma separated.
- `examples` are short sample inputs that belong here. They make routing much more accurate. Add real ones over time.
- `created` is the date the category was added (`seed` for the starter set).

System folders (`inbox`, `journal`, `archive`, `private`) are not categories and are not listed here.

## todos
- name: Todos
- belongs: Something the user needs to DO that is a single action, with or without a due date. Not multi-step efforts with an outcome (that is a project).
- types: task, routine
- decay: fast
- examples: "call the dentist tomorrow" | "renew passport before March" | "remind me to pay rent on the 1st"
- created: seed

## projects
- name: Projects
- belongs: A multi-step effort with a specific outcome that finishes at some point. Has tasks, progress, a state.
- types: project
- decay: slow
- examples: "I'm building a home server this month" | "started rewriting my portfolio site" | "planning the Goa trip in December"
- created: seed

## goals
- name: Goals
- belongs: A longer-term outcome the user wants for their life (health, money, career, skills, relationships). Usually measured over months or years. Projects and habits serve goals.
- types: goal
- decay: permanent
- examples: "I want to run a half marathon next year" | "goal: emergency fund of 6 months expenses" | "want to get fluent in Spanish"
- created: seed

## finance
- name: Finance
- belongs: Durable facts and decisions about money: accounts, cards, investments, loans, insurance, recurring subscriptions, and the reasoning behind money decisions. Not one-off purchases unless they matter long term.
- types: account, card, investment, loan, insurance, subscription, decision
- decay: permanent
- examples: "I got a new credit card with 5% cashback on groceries" | "putting 500 a month into an index fund" | "cancelled Netflix, too expensive"
- created: seed

## media
- name: Media
- belongs: Things to watch, read, listen to or play, and the user's opinion of ones they finished. Watchlists, reading lists, recommendations.
- types: movie, show, book, podcast, music, game, video, article
- decay: slow
- examples: "I want to watch Spider-Man later" | "finished Dune, 8/10, slow middle" | "Sam recommended the podcast Hardcore History"
- created: seed

## people
- name: People
- belongs: A specific person or organisation the user deals with, and facts about them (role, preferences, birthdays, what they recommended, history with them).
- types: person, org
- decay: permanent
- examples: "Priya's birthday is 12 May" | "my manager Alex prefers written updates" | "Acme Corp is the client for the dashboard"
- created: seed

## ideas
- name: Ideas
- belongs: Original thoughts, ideas, opinions, reflections and plans that are not yet actionable. Shower thoughts, business ideas, things the user is mulling over.
- types: idea, reflection
- decay: slow
- examples: "idea: an app that splits bills by voice" | "I think I work better in the mornings" | "maybe I should move cities next year"
- created: seed

## reference
- name: Reference
- belongs: Facts, how-tos, links and knowledge the user wants to look up later that are not about a specific person, project or money item.
- types: howto, fact, link, place
- decay: slow
- examples: "the router admin page is 192.168.1.1" | "good ramen place: Menya, near the station" | "how to clean a cast iron pan: ..."
- created: seed
