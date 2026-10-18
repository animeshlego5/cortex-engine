---
name: cortex-onboarding
description: First-session setup interview for a new Cortex vault. Learns who the user is (name, age, city, currency, work, people, goals, interests, things they own, money setup, how they want replies) and seeds the vault with it, so filing and recall fit them from day one. Use when the session-start check says ONBOARDING NEEDED, when a hook says onboarding has not been done, or when the user asks to "set up", "redo onboarding" or "update my profile".
---

# Onboarding

A friendly interview of about 5 minutes. Ask in **rounds of 3-4 questions**, not one giant form. Every question is skippable ("skip" or "later" is fine).
Accept loose answers and voice-style rambling. Never ask for secrets (card numbers, account numbers, ID numbers, passwords).

## 0. Offer it
If the user's first message was a real request, handle it first. Then say: "This is a new Cortex vault. Can I ask a few quick questions
so I file things the way you'd expect? About 5 minutes, and you can skip anything." On no or later, do not ask again this session.

## 1. The rounds
1. **Basics**: name (and what to call them), age or birth year, city and country (gives the timezone), currency, languages.
2. **Life**: what they do (work or study, role, workplace), who they live with, the close people they will mention often (names and relationships).
3. **Direction**: 2-4 things they are working towards this year (health, money, career, learning, relationships), and any active projects.
4. **Taste**: interests and hobbies; the kinds of films, shows, books, music or games they like; any watch, read or play list they already have in mind.
5. **Life admin** (optional, no numbers): things they own and look after (vehicle, home, devices, pets); a rough money setup (which cards, what investment types,
   recurring subscriptions; names only, never numbers); recurring dates that matter (birthdays, renewals).
6. **Preferences**: how they want replies (short or detailed), whether to confirm before filing or just file, and anything Cortex should always or never do.

After each round, briefly reflect back what you understood (one line) before the next round.

## 2. Seed the vault
- `_meta/core.md`: fill About me (name, age, location and timezone, currency, languages, work), Close people (as `[[links]]`), Current priorities (as `[[links]]`).
- Notes, created with cortex-capture rules (note-format.md): a `people/` note per close person (relationship, birthday as `yearly:`), a `goals/` note per goal,
  a `projects/` note per active project, a `things/` note per owned thing, `finance/` notes per card, investment or subscription mentioned (names and
  facts only), and a `media/` note (status `want`) per title on their list. Link them: goals ↔ projects with `supports::`, investments with `funds::`.
- Interests and tastes go in `_meta/core.md` under a `## Interests and taste` section (recall uses it for "what should I watch or read?").
- Reply preferences and always/never rules go in `_meta/my-rules.md`.
- Categories: do NOT invent categories from interests alone. Create one only if the user explicitly wants to TRACK something
  ("I want to log my workouts") (categories-and-decay.md section 3, rule 1).
- Journal: add one entry for today, "Onboarding", summarising the answers (no secrets).

## 3. Finish
Run `node .engine/scripts/cortex.mjs reindex` and `node .engine/scripts/cortex.mjs done onboarding`. Log `onboarding` in `_meta/log.md`.
Commit if `auto_commit`. Then tell the user, in 3-4 lines, what you set up, and how to use Cortex: "just tell me things; ask me anything;
I'll suggest a cleanup about once a week."

If the user stops partway, save what you have, run `done onboarding` anyway (so they are not nagged), and note in `core.md` which rounds were skipped.
They can say "update my profile" any time to continue.
