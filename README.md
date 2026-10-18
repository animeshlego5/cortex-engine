# Cortex

**An agent-operated second brain.** Talk to your AI agent the way you'd talk to a friend: plans, todos, money decisions,
movies to watch, people, half-formed ideas. Cortex files everything into a clean, linked markdown vault without being told where.
It cleans itself up over time and answers questions like *"what should I watch tonight?"* from what you told it weeks ago.

- **Works with any agent**: Claude Code, Codex, Cursor, OpenCode, Antigravity, Gemini. One `AGENTS.md`, plus shared Agent Skills.
- **Plain markdown**: open it in [Obsidian](https://obsidian.md) for the graph view, or don't. No database, no lock-in.
- **Grows with you**: starts with 9 general categories and creates new ones when your life needs them (car, recipes, a side business...).
- **Forgets the right things**: done todos and stale notes get archived (never deleted). Goals, money and people never decay.
- **Your notes stay on your machine**: the engine (this repo) and your notes live in separate folders. Your vault only *links* to the engine, so pushing the engine can never include a note.

## How it works

```
cortex-engine/             ← THIS repo (rules, skills, scripts). The only thing that goes to GitHub.
my-cortex/                 ← YOUR vault: a local folder (with optional local-only git history for undo)
  AGENTS.md  CLAUDE.md     ← generated from the engine; every agent reads these
  inbox/ journal/          ← raw input: unsorted items, and a verbatim daily log
  todos/ projects/ goals/ finance/ media/ people/ things/ ideas/ reference/   ← filed notes (+ categories Cortex adds)
  archive/                 ← cleaned-up notes, still searchable
  private/                 ← agents are blocked from reading this
  _meta/                   ← YOUR categories, rules, config, logs (never overwritten by updates)
  .engine/                 ← a link to cortex-engine/ (a junction on Windows, a symlink elsewhere)
```

1. **Capture**: you say anything. The agent keeps your raw words in `journal/`, splits them into items, looks for existing notes,
   routes each item using `_meta/categories.md`, writes a note with structured frontmatter, and links it to related notes.
2. **Recall**: you ask anything. The agent reads `index.md` → the category hub → matching notes, follows links, and answers with sources.
3. **Maintain**: on your first message each day, a hook (or the `AGENTS.md` startup rule) checks whether cleanup is due.
   The script works out what is stale and the agent shows a short summary. Nothing changes until you say **apply**.
4. **Learn**: your corrections are logged, and the weekly review turns repeated ones into better routing rules for your vault.

## Quick start

Requirements: **git**, **Node.js 18+** (for the helper scripts; agents fall back to manual steps without it), and any coding agent.

```bash
git clone https://github.com/<owner>/cortex-engine.git
cd cortex-engine
node scripts/cortex.mjs init ../my-cortex          # creates your vault, linked to this engine
cd ../my-cortex
claude                                            # or codex, cursor, opencode...
```

Keep the `cortex-engine` folder where it is. If you move it, run `node scripts/cortex.mjs init <your-vault>` from its new location to re-link.
Back up your vault however you like (an external drive, a cloud-synced folder, or your own private git remote).

Then just talk: *"I want to watch Dune later"*, *"remind me to renew my passport in March"*, *"what should I watch?"*.
Fill in `_meta/core.md` (name, timezone, currency) on day one. It makes everything more accurate.

## Capturing from anywhere

| Where | How |
|---|---|
| Desktop, typing | Run your agent in the vault folder and type. |
| Desktop, voice | Claude Code: `/voice tap`, then tap Space, speak, tap Space. Built in, no extra cost. |
| Phone (PC on) | Run `claude --remote-control` in the vault on your PC, then open that session from the Claude app's **Code** tab and dictate with your keyboard mic. Notes stay on your PC. |
| Phone (PC off) | Only if you choose to put the vault in a private GitHub repo: open it in a Claude app cloud session. This sends your notes to GitHub, so Cortex doesn't set it up for you. |
| Anything else | Drop a `.md` or `.txt` file into `inbox/` (sync app, email-to-file, shortcuts). It gets filed in the next session. |

## Updating

- **Get engine updates**: `git pull` in `cortex-engine/`, then in your vault run `node .engine/scripts/cortex.mjs setup`
  (or just tell your agent "the engine was updated"). Your `_meta/` files and notes are never touched.
- **Improve the engine**: ask your agent to "improve Cortex so that ...". It edits the engine (through the `.engine` link), regenerates your vault,
  and leaves committing to you. Review, commit and push from `cortex-engine/` as usual.
- **Safety net**: run `node scripts/cortex.mjs check-engine --install-hook` once in `cortex-engine/`. Every `git push` then checks that
  the engine has no vault folders and no card numbers or passwords, and refuses the push if it does.
- **Your own rules** go in `_meta/my-rules.md` and `_meta/categories.md`. They are yours and never overwritten.

## Commands

`node .engine/scripts/cortex.mjs <command>`: `status`, `plan [--weekly]`, `reindex`, `lint`, `archive <path>`, `restore <path>`,
`touch <path>`, `done daily|weekly`, `setup`. From the engine folder: `init <folder>`, `check-engine`. Agents run these for you. See `help`.

## Privacy

- Never tell it full card numbers, passwords, PINs or ID numbers. Cortex is instructed to redact them, and `lint` flags anything that slips through.
- Your notes go to whatever model your agent uses. Check your provider's data settings (e.g. turn off training on your data).
- `private/` is blocked for Claude Code via `.claude/settings.json` deny rules and is git-ignored.

## Agent support

| Agent | Rules | Skills | Auto daily check |
|---|---|---|---|
| Claude Code | `CLAUDE.md` → `AGENTS.md` | `.claude/skills/` | hook (`UserPromptSubmit`) |
| Codex CLI | `AGENTS.md` | `.agents/skills/` | hook (`.codex/hooks.json`, approve it once via `/hooks`) |
| Cursor, OpenCode, Antigravity, others | `AGENTS.md` | `.agents/skills/` | startup rule in `AGENTS.md` |

## Layout of this repo

```
templates/   AGENTS.md, CLAUDE.md and the starter _meta/ files copied into new vaults
skills/      cortex-capture, cortex-recall, cortex-maintenance, cortex-weekly-review, cortex-engine-update
reference/   note-format.md (note anatomy, links, entities), categories-and-decay.md (routing, new categories, cleanup)
scripts/     cortex.mjs (dependency-free CLI)
tests/       inputs.md (40-input routing test set)
```

## Credits

Ideas borrowed from Andrej Karpathy's LLM-wiki pattern, [agent-second-brain](https://github.com/smixs/agent-second-brain),
[obsidian-second-brain](https://github.com/eugeniughelbur/obsidian-second-brain), [claude-obsidian](https://github.com/AgriciDaniel/claude-obsidian),
[claudesidian](https://github.com/heyitsnoah/claudesidian) and [basic-memory](https://github.com/basicmachines-co/basic-memory).

License: MIT
