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
2. **Recall**: you ask anything. The agent searches with `cortex find` (by field, or ranked text across notes and the journal), follows links, and answers with sources.
3. **Maintain**: about once a week (configurable), a hook (or the `AGENTS.md` startup rule) notices a cleanup is due.
   The script works out what is stale and the agent shows a short summary. Nothing changes until you say **apply**.
4. **Learn**: your corrections are logged, and the weekly cleanup turns repeated ones into better routing rules for your vault.

On the first session in a new vault, Cortex runs a short **onboarding interview** (name, city, currency, people, goals, interests, the things you own) so it fits you from day one.

## Getting started

### 1. Install the prerequisites (once)
- **git**: https://git-scm.com
- **Node.js 18 or newer** (LTS recommended): https://nodejs.org, or `winget install OpenJS.NodeJS.LTS` on Windows, or `brew install node` on macOS.
  Afterwards, **restart your terminal and editor** so they can find `node` (check with `node --version`).
- **An AI coding agent**: Claude Code (terminal, or the VS Code / Antigravity extension), Codex, Cursor, OpenCode...
- Optional: **[Obsidian](https://obsidian.md)**, to browse your notes and see the graph.

### 2. Create your vault (once)
```bash
git clone https://github.com/<owner>/cortex-engine.git
cd cortex-engine
node scripts/cortex.mjs init ../my-cortex      # creates your vault next to the engine, linked to it
```
- **Keep `cortex-engine` where it is.** Your vault's `.engine` folder points at it. If you move it, run `node scripts/cortex.mjs init <your-vault>` from the new location to re-link.
- **Your vault never leaves your machine** unless you choose to back it up somewhere (external drive, synced folder, your own private git remote).

### 3. Open the vault in your agent
Always start the agent **inside the vault folder** (`my-cortex`), not the engine folder:
- **Claude Code in VS Code or Antigravity**: File → Open Folder → `my-cortex`, then open the Claude Code panel.
- **Claude Code in a terminal**: `cd my-cortex` then `claude`. Codex, OpenCode and others work the same way.
- **Obsidian** (optional, any time): "Open folder as vault" → `my-cortex`. Use Graph view to see how things connect.

### 4. First session: the onboarding interview
Say "hi". Cortex asks a few rounds of short questions (name, city, currency, work, the people you mention, your goals, your tastes,
the things you own, how you like replies). Skip anything you like. It sets up your profile and first notes from your answers.
To redo or extend it later, say "update my profile".

### 5. Everyday use: the rules of thumb
- **Just talk. Don't organise.** One thought or ten in a message, typed or spoken: *"Sam says I should watch Dune; also remind me to renew my passport in March."*
  Cortex decides where everything goes, links it, and confirms in a line.
- **Ask anything.** *"What should I watch?"*, *"What's due this week?"*, *"What did Sam recommend?"*, *"Which card for groceries?"*. Answers cite the notes they came from.
- **Correct it when it's wrong.** *"No, that's a work thing."* It fixes the note and remembers the correction. Repeated corrections become better rules at the weekly cleanup.
- **Give it standing rules.** *"Always file anything about running under my marathon goal."* These go into `_meta/my-rules.md`.
- **Tell it about changes, not just new things.** *"Cancelled Netflix"*, *"Alex is my skip-level now"*. It updates the existing note and keeps the history.
- **Weekly cleanup.** About once a week Cortex shows one short numbered summary (inbox to file, stale notes to archive, rule improvements).
  Reply **apply**, **apply 1,3** or **skip**. Nothing changes without your OK, and you won't be asked more than once a week.
- **Never share secrets.** No card numbers, CVVs, passwords, PINs or ID numbers. Cortex redacts them anyway; at most it keeps the last 4 digits.
- **Use voice.** In Claude Code type `/voice tap` once, then tap Space to talk.

### 6. Where things live
You never need to touch the folders, but if you're curious: each category is a folder with a `Hub - <Name>.md` page listing its notes,
`index.md` is the map of everything, `journal/` keeps your raw words per day, and `_meta/core.md` is your profile.

## Capturing from anywhere

| Where | How |
|---|---|
| Desktop, typing | Run your agent in the vault folder and type. |
| Desktop, one click (Windows) | Install the Claude Code CLI (`irm https://claude.ai/install.ps1 \| iex`), then run `node .engine/scripts/cortex.mjs shortcut` in the vault. A **Cortex** icon appears on the Desktop that opens Claude Code in the vault in Windows Terminal. No editor needed. |
| Desktop, voice | Claude Code: `/voice tap`, then tap Space, speak, tap Space. Built in, no extra cost. |
| Phone (PC on) | Run `claude --remote-control` in the vault on your PC, then open that session from the Claude app's **Code** tab and dictate with your keyboard mic. Notes stay on your PC. |
| Phone (PC off) | Only if you choose to put the vault in a private GitHub repo: open it in a Claude app cloud session. This sends your notes to GitHub, so Cortex doesn't set it up for you. |
| Anything else | Drop a `.md` or `.txt` file into `inbox/` (sync app, email-to-file, shortcuts). It gets filed in the next session. |

**Notifications**: in Claude Code, a desktop notification pops up when Cortex finishes a reply ("Cortex: done") and when it needs
your answer or permission ("Cortex: needs you"). Windows shows them bottom-right, macOS in Notification Center, Linux via `notify-send`.
Turn either off in `_meta/config.json`: `"notifications": { "done": false, "needs_input": true }`.

## Updating

- **Get engine updates**: `git pull` in `cortex-engine/`, then in your vault run `node .engine/scripts/cortex.mjs setup`
  (or just tell your agent "the engine was updated"). Your `_meta/` files and notes are never touched.
- **Improve the engine**: ask your agent to "improve Cortex so that ...". It edits the engine (through the `.engine` link), regenerates your vault,
  and leaves committing to you. Review, commit and push from `cortex-engine/` as usual.
- **Safety net**: run `node scripts/cortex.mjs check-engine --install-hook` once in `cortex-engine/`. Every `git push` then checks that
  the engine has no vault folders and no card numbers or passwords, and refuses the push if it does.
- **Your own rules** go in `_meta/my-rules.md` and `_meta/categories.md`. They are yours and never overwritten.

## Commands

`node .engine/scripts/cortex.mjs <command>`: `status`, `find`, `graph`, `plan`, `reindex`, `lint`, `archive <path>`, `restore <path>`,
`touch <path>`, `done cleanup|onboarding`, `setup`. From the engine folder: `init <folder>`, `check-engine`. Agents run these for you. See `help`.

## Privacy

- Never tell it full card numbers, passwords, PINs or ID numbers. Cortex is instructed to redact them, and `lint` flags anything that slips through.
- Your notes go to whatever model your agent uses. Check your provider's data settings (e.g. turn off training on your data).
- `private/` is blocked for Claude Code via `.claude/settings.json` deny rules and is git-ignored.

## Agent support

| Agent | Rules | Skills | Auto cleanup check |
|---|---|---|---|
| Claude Code | `CLAUDE.md` → `AGENTS.md` | `.claude/skills/` | hook (`UserPromptSubmit`) |
| Codex CLI | `AGENTS.md` | `.agents/skills/` | hook (`.codex/hooks.json`, approve it once via `/hooks`) |
| Cursor, OpenCode, Antigravity, others | `AGENTS.md` | `.agents/skills/` | startup rule in `AGENTS.md` |

## Layout of this repo

```
templates/   AGENTS.md, CLAUDE.md and the starter _meta/ files copied into new vaults
skills/      cortex-onboarding, cortex-capture, cortex-recall, cortex-maintenance (weekly cleanup), cortex-engine-update
reference/   note-format.md (note anatomy, links, entities), categories-and-decay.md (routing, new categories, cleanup)
scripts/     cortex.mjs (dependency-free CLI)
tests/       inputs.md (routing test set), generate-vault.mjs (synthetic vaults for scale tests)
```

## Credits

Ideas borrowed from Andrej Karpathy's LLM-wiki pattern, [agent-second-brain](https://github.com/smixs/agent-second-brain),
[obsidian-second-brain](https://github.com/eugeniughelbur/obsidian-second-brain), [claude-obsidian](https://github.com/AgriciDaniel/claude-obsidian),
[claudesidian](https://github.com/heyitsnoah/claudesidian) and [basic-memory](https://github.com/basicmachines-co/basic-memory).

License: MIT
