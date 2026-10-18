#!/usr/bin/env node
// Cortex CLI. Dependency-free, Node 18+.
// Usage (from a vault root): node .engine/scripts/cortex.mjs <command> [options]
// Run `node .engine/scripts/cortex.mjs help` for the command list.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const ENGINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SYSTEM_DIRS = new Set(['inbox', 'journal', 'archive', 'private', '_meta', '.engine', '.git', '.obsidian', '.trash', '.claude', '.agents', '.codex', 'node_modules']);
const ROOT_FILES = new Set(['index.md', 'AGENTS.md', 'CLAUDE.md', 'README.md', 'GEMINI.md']);
const ENGINE_ALLOWED = new Set(['README.md', 'LICENSE', 'CHANGELOG.md', '.gitignore', '.gitattributes', 'templates', 'skills', 'reference', 'scripts', 'tests', 'docs', '.github']);
const REQUIRED_FIELDS = ['type', 'category', 'description', 'status', 'created', 'updated'];
const HOOK_MARK = 'cortex.mjs';

// ---------- small utilities ----------

function fail(msg) { console.error(`cortex: ${msg}`); process.exit(1); }
const pad = (n) => String(n).padStart(2, '0');
function localDate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
// CORTEX_TODAY=YYYY-MM-DD overrides the clock (used by the test set to simulate days)
function today() { return asDate(process.env.CORTEX_TODAY) || localDate(new Date()); }
function nowStamp() { const d = new Date(); return `${today()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function asDate(v) { const m = String(v ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[1]}-${m[2]}-${m[3]}` : null; }
function daysBetween(a, b) {
  const [y1, m1, d1] = a.split('-').map(Number); const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 864e5);
}
function maxDate(...ds) { return ds.map(asDate).filter(Boolean).sort().pop() || null; }
const toPosix = (p) => p.split(path.sep).join('/');
const readText = (f) => fs.readFileSync(f, 'utf8');
function readJson(f, fallback) { try { return JSON.parse(readText(f)); } catch { return fallback; } }
function writeJson(f, obj) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(obj, null, 2) + '\n'); }
function writeIfChanged(f, text) {
  if (fs.existsSync(f) && readText(f) === text) return false;
  fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); return true;
}
function takeFlag(args, name, hasValue = false) {
  const i = args.indexOf(name); if (i < 0) return hasValue ? null : false;
  const v = hasValue ? args[i + 1] : true; args.splice(i, hasValue ? 2 : 1); return v;
}
function git(cwd, args, opts = {}) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: opts.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'] });
}
function tryGit(cwd, args) { try { return git(cwd, args).trim(); } catch { return null; } }
function readStdin() { try { return fs.readFileSync(0, 'utf8'); } catch { return ''; } }

// ---------- vault location ----------

// A vault is a folder whose `.engine` (usually a link to the cortex-engine repo) contains this script.
const isVault = (d) => fs.existsSync(path.join(d, '.engine', 'scripts', 'cortex.mjs'));
function findUp(start, test) {
  let d = path.resolve(start);
  for (;;) { if (test(d)) return d; const p = path.dirname(d); if (p === d) return null; d = p; }
}
function resolveVault(args, { quiet = false } = {}) {
  const flag = takeFlag(args, '--vault', true);
  if (flag) return path.resolve(flag);
  for (const env of [process.env.CORTEX_VAULT, process.env.CLAUDE_PROJECT_DIR]) if (env && isVault(env)) return path.resolve(env);
  const found = findUp(process.cwd(), isVault);
  if (found || quiet) return found;
  fail('cannot find the vault. Run this inside a vault (a folder with .engine/), pass --vault <path>, or create one with `init`.');
}
function meta(vault, ...p) { return path.join(vault, '_meta', ...p); }
function loadConfig(vault) {
  const defaults = readJson(path.join(ENGINE, 'templates', 'meta', 'config.json'), {});
  const user = readJson(meta(vault, 'config.json'), {});
  const merged = { ...defaults, ...user };
  for (const k of Object.keys(defaults)) {
    if (defaults[k] && typeof defaults[k] === 'object' && !Array.isArray(defaults[k])) merged[k] = { ...defaults[k], ...(user[k] || {}) };
  }
  return merged;
}
function loadState(vault) { return readJson(meta(vault, 'state.json'), {}); }
function saveState(vault, s) { writeJson(meta(vault, 'state.json'), s); }
function appendLog(vault, action, details) {
  const f = meta(vault, 'log.md');
  if (!fs.existsSync(f)) return;
  fs.appendFileSync(f, `- ${nowStamp()} | ${action} | ${details}\n`);
}

// ---------- frontmatter ----------

function splitList(s) {
  const out = []; let cur = ''; let q = null; let depth = 0;
  for (const ch of s) {
    if (q) { if (ch === q) q = null; cur += ch; continue; }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
    if (ch === '[') depth++;
    if (ch === ']') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}
function scalar(v) {
  v = v.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  if (v === 'true') return true;
  if (v === 'false') return false;
  return v;
}
function yamlValue(v) {
  v = v.trim();
  if (v.startsWith('[') && !v.startsWith('[[') && v.endsWith(']')) {
    const inner = v.slice(1, -1).trim();
    return inner ? splitList(inner).map(scalar) : [];
  }
  return scalar(v);
}
// Parses the simple YAML subset used in notes: `key: value`, inline lists, and `- item` block lists. Nested maps are ignored.
function parseYaml(src) {
  const out = {}; let lastKey = null;
  for (const line of src.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const item = line.match(/^\s*-\s+(.*)$/);
    if (item && lastKey && (out[lastKey] === '' || Array.isArray(out[lastKey]))) {
      if (!Array.isArray(out[lastKey])) out[lastKey] = [];
      out[lastKey].push(scalar(item[1]));
      continue;
    }
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) { lastKey = kv[1]; out[lastKey] = kv[2].trim() === '' ? '' : yamlValue(kv[2]); }
  }
  return out;
}
const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(\r?\n|$)/;
function splitFrontmatter(text) {
  const m = text.match(FM_RE);
  if (!m) return { fm: null, rawFm: '', body: text };
  return { fm: parseYaml(m[1]), rawFm: m[1], body: text.slice(m[0].length) };
}
function setField(text, key, val) {
  const m = text.match(FM_RE);
  if (!m) return `---\n${key}: ${val}\n---\n${text}`;
  const lines = m[1].split(/\r?\n/);
  const i = lines.findIndex((l) => l.startsWith(`${key}:`));
  if (i >= 0) lines[i] = `${key}: ${val}`; else lines.push(`${key}: ${val}`);
  return text.replace(m[0], () => `---\n${lines.join('\n')}\n---\n`);
}

// ---------- links ----------

const LINK_RE = /\[\[([^\]|#^\n]+)(?:[#^][^\]|\n]*)?(?:\|[^\]\n]*)?\]\]/g;
function linkTarget(raw) { return raw.trim().replace(/\\$/, '').replace(/\\/g, '/').split('/').pop().replace(/\.md$/i, '').trim().toLowerCase(); }
function stripCode(text) { return text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, ''); }
function extractLinks(text) { return [...stripCode(text).matchAll(LINK_RE)].map((m) => linkTarget(m[1])); }
function relatedSection(body) {
  const m = body.match(/^## Related[ \t]*\r?\n([\s\S]*?)(?=^## |(?![\s\S]))/m);
  return m ? m[1] : '';
}
function typedLinks(body) {
  const out = [];
  for (const line of relatedSection(body).split(/\r?\n/)) {
    const m = line.match(/^\s*-\s+([A-Za-z_]+)::\s*(.*)$/);
    if (m) out.push({ key: m[1], targets: extractLinks(m[2]), line: line.trim() });
  }
  return out;
}

// ---------- categories ----------

function loadCategories(vault) {
  const f = meta(vault, 'categories.md');
  if (!fs.existsSync(f)) return [];
  const cats = []; let cur = null;
  for (const line of readText(f).split(/\r?\n/)) {
    const h = line.match(/^##\s+([a-z0-9][a-z0-9-]*)\s*$/);
    if (h) { cur = { slug: h[1], name: h[1], belongs: '', types: [], decay: 'slow', created: 'seed' }; cats.push(cur); continue; }
    const kv = cur && line.match(/^-\s+([a-z_]+):\s*(.*)$/);
    if (kv) {
      const [, k, v] = kv;
      cur[k] = k === 'types' ? v.split(',').map((t) => t.trim()).filter(Boolean) : v.trim();
    }
  }
  return cats;
}
const hubName = (cat) => `Hub - ${cat.name}`;

// ---------- vault scan ----------

function walk(dir, base, out = []) {
  let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    const rel = toPosix(path.relative(base, abs));
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) {
      if (rel.split('/').length === 1 && ['private', '_meta', '.engine', '.git', '.obsidian', '.trash', '.claude', '.agents', '.codex', 'node_modules'].includes(e.name)) continue;
      if (e.name.startsWith('.')) continue;
      walk(abs, base, out);
    } else if (e.name !== '.gitkeep') out.push({ abs, rel });
  }
  return out;
}
function scanVault(vault) {
  const files = walk(vault, vault);
  const notes = [];
  for (const f of files) {
    if (!f.rel.toLowerCase().endsWith('.md')) continue;
    const text = readText(f.abs);
    const { fm, rawFm, body } = splitFrontmatter(text);
    const parts = f.rel.split('/');
    notes.push({
      ...f,
      name: path.basename(f.rel, path.extname(f.rel)),
      top: parts.length > 1 ? parts[0] : '',
      depth: parts.length - 1,
      fm: fm || {},
      hasFm: !!fm,
      body,
      links: ROOT_FILES.has(f.rel) && f.rel !== 'index.md' ? [] : extractLinks(rawFm + '\n' + body),
      typed: typedLinks(body),
    });
  }
  return { files, notes };
}

// ---------- access tracking ----------

function loadAccess(vault) { return readJson(meta(vault, 'access.json'), {}); }
function touchPaths(vault, absPaths) {
  const access = loadAccess(vault); const t = today(); let changed = false;
  for (const p of absPaths) {
    const rel = toPosix(path.relative(vault, path.resolve(vault, p)));
    if (rel.startsWith('..') || path.isAbsolute(rel) || !rel.toLowerCase().endsWith('.md')) continue;
    const top = rel.split('/')[0];
    if (['_meta', '.engine', 'private', 'journal', '.claude', '.agents'].includes(top) || ROOT_FILES.has(rel)) continue;
    const prev = access[rel] || { count: 0 };
    access[rel] = { last: t, count: (prev.count || 0) + 1 };
    changed = true;
  }
  if (changed) writeJson(meta(vault, 'access.json'), access);
}

// ---------- secrets ----------

function luhn(num) {
  let sum = 0; let dbl = false;
  for (let i = num.length - 1; i >= 0; i--) { let d = +num[i]; if (dbl) { d *= 2; if (d > 9) d -= 9; } sum += d; dbl = !dbl; }
  return sum % 10 === 0;
}
function secretFindings(text) {
  const found = [];
  for (const m of text.matchAll(/\b(?:\d[ -]?){13,19}\b/g)) {
    const digits = m[0].replace(/\D/g, '');
    if (digits.length >= 13 && digits.length <= 19 && luhn(digits)) found.push('possible full card number');
  }
  if (/\b(password|passcode|pin|cvv|cvc|otp)\s*[:=]\s*\S+/i.test(text)) found.push('possible password/PIN/CVV');
  return [...new Set(found)];
}

// ---------- lint ----------

function lint(vault) {
  const cfg = loadConfig(vault); const cats = loadCategories(vault);
  const catBy = Object.fromEntries(cats.map((c) => [c.slug, c]));
  const { files, notes } = scanVault(vault);
  const relTypes = new Set(cfg.relation_types || []);
  const errors = []; const warnings = []; const info = [];
  const names = new Map();
  for (const n of notes) {
    const k = n.name.toLowerCase();
    if (!names.has(k)) names.set(k, []);
    names.get(k).push(n.rel);
  }
  for (const [, rels] of names) if (rels.length > 1) errors.push({ kind: 'duplicate-name', path: rels.join(', '), msg: 'same file name in several places; links are ambiguous' });

  const unresolved = new Map();
  for (const n of notes) {
    const isCatNote = !!catBy[n.top] && n.fm.type !== 'hub';
    const isArchived = n.top === 'archive';
    if (isCatNote) {
      if (!n.hasFm) { errors.push({ kind: 'no-frontmatter', path: n.rel, msg: 'note has no frontmatter' }); }
      else {
        const missing = REQUIRED_FIELDS.filter((f) => n.fm[f] === undefined || n.fm[f] === '');
        if (missing.length) errors.push({ kind: 'missing-fields', path: n.rel, msg: `missing: ${missing.join(', ')}` });
        if (n.fm.category && n.fm.category !== n.top) errors.push({ kind: 'category-mismatch', path: n.rel, msg: `category "${n.fm.category}" but lives in ${n.top}/` });
        const cat = catBy[n.top];
        if (n.fm.type && cat.types.length && !cat.types.includes(n.fm.type)) warnings.push({ kind: 'unknown-type', path: n.rel, msg: `type "${n.fm.type}" not in ${n.top} types (${cat.types.join(', ')})` });
      }
      if (n.depth > (cfg.categories?.max_depth ?? 3)) warnings.push({ kind: 'too-deep', path: n.rel, msg: 'folder nesting deeper than max_depth' });
    }
    if (n.top === 'inbox' && n.hasFm && n.fm.type === 'inbox' && !n.fm.candidate_category) warnings.push({ kind: 'inbox-no-candidate', path: n.rel, msg: 'inbox item without candidate_category' });
    if (!n.top && !ROOT_FILES.has(n.rel)) warnings.push({ kind: 'loose-file', path: n.rel, msg: 'note at vault root; move it into a category or inbox/' });
    if (n.top && !catBy[n.top] && !SYSTEM_DIRS.has(n.top)) warnings.push({ kind: 'unknown-folder', path: n.rel, msg: `folder "${n.top}/" is not a category in _meta/categories.md` });
    for (const t of n.typed) {
      if (!relTypes.has(t.key)) errors.push({ kind: 'unknown-relation', path: n.rel, msg: `relation "${t.key}" is not in config relation_types` });
      for (const tg of t.targets) if (!names.has(tg) && !isArchived) errors.push({ kind: 'broken-typed-link', path: n.rel, msg: `"${t.line}" points to a missing note` });
    }
    for (const tg of n.links) if (!names.has(tg)) {
      if (!unresolved.has(tg)) unresolved.set(tg, new Set());
      unresolved.get(tg).add(n.rel);
    }
    if (n.top !== 'archive') for (const s of secretFindings(n.body + n.rawFm)) warnings.push({ kind: 'possible-secret', path: n.rel, msg: s });
  }
  for (const f of files) {
    if (f.rel.toLowerCase().endsWith('.md')) continue;
    const top = f.rel.split('/')[0];
    if (top === 'inbox' || top === '_meta' || f.rel.split('/').length === 1) continue;
    if (catBy[top]) info.push({ kind: 'attachment', path: f.rel, msg: 'non-markdown file in a category folder' });
  }
  const unresolvedList = [...unresolved].map(([target, from]) => ({ target, count: from.size, from: [...from].slice(0, 5) }))
    .sort((a, b) => b.count - a.count);
  return { errors, warnings, info, unresolved: unresolvedList };
}

// ---------- plan ----------

function isDue(vault, cfg) {
  const s = loadState(vault); const t = today();
  const daily = !s.last_daily || s.last_daily < t;
  const every = cfg.maintenance?.weekly_every_days ?? 7;
  const weekly = !s.last_weekly || daysBetween(s.last_weekly, t) >= every;
  return { daily, weekly, state: s };
}

function buildPlan(vault, { weekly = false } = {}) {
  const cfg = loadConfig(vault); const cats = loadCategories(vault);
  const catBy = Object.fromEntries(cats.map((c) => [c.slug, c]));
  const { files, notes } = scanVault(vault);
  const access = loadAccess(vault); const t = today();
  const due = isDue(vault, cfg);
  const plan = {
    generated: nowStamp(), today: t, daily_due: due.daily, weekly_due: due.weekly,
    inbox: [], promotions: [], needs_review: [], archive: [], ask: [], lint: null, deferred: 0,
  };

  // inbox
  const groups = new Map();
  for (const f of files.filter((x) => x.rel.startsWith('inbox/'))) {
    const n = notes.find((x) => x.rel === f.rel);
    const created = asDate(n?.fm.created) || localDate(fs.statSync(f.abs).mtime);
    const structured = !!(n && n.fm.type === 'inbox');
    const item = { path: f.rel, raw: !structured, created, age_days: daysBetween(created, t), candidate_category: structured ? (n.fm.candidate_category || 'unknown') : null, description: n?.fm.description || '' };
    plan.inbox.push(item);
    if (structured && item.candidate_category !== 'unknown') {
      const g = groups.get(item.candidate_category) || { items: [], days: new Set() };
      g.items.push(f.rel); g.days.add(created); groups.set(item.candidate_category, g);
    }
  }
  const cc = cfg.categories || {};
  for (const [slug, g] of groups) {
    if (catBy[slug]) { plan.promotions.push({ slug, existing: true, count: g.items.length, items: g.items, note: 'category already exists; file these into it' }); continue; }
    if (g.items.length >= (cc.new_min_items ?? 3) && g.days.size >= (cc.new_min_distinct_days ?? 2)) {
      plan.promotions.push({ slug, existing: false, count: g.items.length, distinct_days: g.days.size, items: g.items });
    }
  }

  // notes in categories
  const dc = cfg.decay || {}; const td = cfg.todos || {};
  for (const n of notes) {
    const cat = catBy[n.top];
    if (!cat || n.fm.type === 'hub' || !n.hasFm || n.fm.status === 'archived') continue;
    if (n.fm.needs_review === true) plan.needs_review.push({ path: n.rel, category: cat.slug, description: n.fm.description || '' });
    const last = maxDate(n.fm.updated, n.fm.created, access[n.rel]?.last) || t;
    const age = daysBetween(last, t);
    const status = String(n.fm.status || '');
    const exempt = n.fm.pinned === true || String(n.fm.importance) === '5' || cat.decay === 'permanent';
    if (exempt) continue;
    if (n.fm.type === 'task') {
      const upd = asDate(n.fm.updated) || last;
      if (['done', 'dropped'].includes(status) && daysBetween(upd, t) >= (td.archive_done_after_days ?? 14)) {
        plan.archive.push({ path: n.rel, reason: `${status} ${daysBetween(upd, t)}d ago`, age_days: age });
      } else if (['todo', 'doing', 'waiting'].includes(status)) {
        const dueDate = asDate(n.fm.due);
        if (dueDate && dueDate < t && age >= (td.flag_overdue_after_days ?? 30)) plan.ask.push({ path: n.rel, question: 'overdue', detail: `due ${dueDate}, untouched ${age}d: keep, reschedule or drop?`, age_days: age });
        else if (!dueDate && dc.fast && age >= dc.fast.archive) plan.ask.push({ path: n.rel, question: 'stale-open', detail: `open and untouched ${age}d: still relevant?`, age_days: age });
      }
      continue;
    }
    if (['project', 'goal'].includes(n.fm.type) && status === 'active') continue;
    const th = dc[cat.decay];
    if (!th) continue;
    if (age >= th.archive) {
      if (['want', 'in-progress', 'todo', 'doing'].includes(status)) plan.ask.push({ path: n.rel, question: 'still-want', detail: `status "${status}", untouched ${age}d: still want it?`, age_days: age });
      else plan.archive.push({ path: n.rel, reason: `untouched ${age}d (${cat.decay})`, age_days: age });
    }
  }
  plan.archive.sort((a, b) => b.age_days - a.age_days);
  plan.ask.sort((a, b) => b.age_days - a.age_days);

  // cap work per run: inbox, promotions and reviews first, then asks, then archives
  const max = cfg.maintenance?.max_items_per_run ?? 15;
  let budget = max - plan.inbox.length - plan.promotions.length - plan.needs_review.length;
  const keepAsk = Math.max(0, Math.min(plan.ask.length, budget)); budget -= keepAsk;
  const keepArc = Math.max(0, Math.min(plan.archive.length, budget));
  plan.deferred = (plan.ask.length - keepAsk) + (plan.archive.length - keepArc);
  plan.ask = plan.ask.slice(0, keepAsk); plan.archive = plan.archive.slice(0, keepArc);

  const l = lint(vault);
  plan.lint = { errors: l.errors.length, warnings: l.warnings.length, items: [...l.errors, ...l.warnings].slice(0, 10) };

  if (weekly || due.weekly) {
    // journal months fully older than the rollup threshold
    const roll = cfg.journal?.rollup_after_days ?? 30; const months = new Map();
    for (const f of files) {
      const m = f.rel.match(/^journal\/(\d{4}-\d{2})-\d{2}\.md$/);
      if (!m) continue;
      if (!months.has(m[1])) months.set(m[1], []);
      months.get(m[1]).push(f.rel);
    }
    plan.journal_rollup = [...months].filter(([, fs_]) => fs_.every((p) => daysBetween(p.slice(8, 18), t) >= roll))
      .map(([month, fs_]) => ({ month, files: fs_.length }));
    plan.merge_proposals = cats.filter((c) => asDate(c.created) && daysBetween(asDate(c.created), t) >= (cc.merge_after_days ?? 60))
      .map((c) => ({ slug: c.slug, notes: notes.filter((n) => n.top === c.slug && n.fm.type !== 'hub').length, created: c.created }))
      .filter((c) => c.notes < (cc.merge_below_notes ?? 3));
    plan.unresolved_links = l.unresolved.filter((u) => u.count >= 2).slice(0, 20);
    const corr = fs.existsSync(meta(vault, 'corrections.md')) ? readText(meta(vault, 'corrections.md')).split(/\r?\n/).filter((x) => /^- \d{4}-/.test(x) && !x.includes('-> applied')) : [];
    plan.open_corrections = corr.length;
  }
  return plan;
}

function planCount(p) { return p.inbox.length + p.promotions.length + p.needs_review.length + p.archive.length + p.ask.length + (p.lint?.errors || 0); }

function planMarkdown(p) {
  const L = [`# Maintenance plan (${p.generated})`, '', 'Generated by `cortex plan`. Proposals only; nothing has been changed.', '',
    `Daily maintenance due: ${p.daily_due ? 'yes' : 'no'} · Weekly review due: ${p.weekly_due ? 'YES (offer it to the user)' : 'no'}`, ''];
  const sec = (title, arr, fmt) => { if (arr && arr.length) { L.push(`## ${title}`, ...arr.map(fmt), ''); } };
  sec('Inbox', p.inbox, (i) => `- ${i.path}${i.raw ? ' (raw drop)' : ` · candidate: ${i.candidate_category}`} · ${i.age_days}d${i.description ? ` · ${i.description}` : ''}`);
  sec('Category promotions', p.promotions, (x) => x.existing ? `- ${x.slug}: ${x.count} inbox items match an EXISTING category; file them` : `- NEW **${x.slug}**: ${x.count} items over ${x.distinct_days} days → ${x.items.join(', ')}`);
  sec('Needs review (low-confidence filing)', p.needs_review, (x) => `- ${x.path} · ${x.description}`);
  sec('Questions for the user', p.ask, (x) => `- ${x.path} · ${x.detail}`);
  sec('Archive candidates', p.archive, (x) => `- ${x.path} · ${x.reason}`);
  if (p.lint && (p.lint.errors || p.lint.warnings)) { L.push(`## Lint: ${p.lint.errors} errors, ${p.lint.warnings} warnings`, ...p.lint.items.map((i) => `- [${i.kind}] ${i.path}: ${i.msg}`), ''); }
  if (p.deferred) L.push(`_${p.deferred} more items deferred to the next run._`, '');
  sec('Weekly: journal months to roll up', p.journal_rollup, (x) => `- ${x.month} (${x.files} days)`);
  sec('Weekly: small categories to consider merging', p.merge_proposals, (x) => `- ${x.slug}: ${x.notes} notes since ${x.created}`);
  sec('Weekly: names linked from several notes with no note yet', p.unresolved_links, (x) => `- [[${x.target}]] ×${x.count}`);
  if (p.open_corrections) L.push(`Weekly: ${p.open_corrections} unapplied corrections in _meta/corrections.md`, '');
  if (planCount(p) === 0 && !p.journal_rollup?.length && !p.merge_proposals?.length) L.push('Nothing to do. The vault is tidy.');
  return L.join('\n') + '\n';
}

function writePlan(vault, opts) {
  const p = buildPlan(vault, opts);
  writeJson(meta(vault, 'maintenance-plan.json'), p);
  fs.writeFileSync(meta(vault, 'maintenance-plan.md'), planMarkdown(p));
  return p;
}

// ---------- reindex ----------

function hubTemplate(cat) {
  return `---\ntype: hub\ncategory: ${cat.slug}\ndescription: "Hub for ${cat.name.replace(/"/g, "'")}"\ncreated: ${today()}\n---\n# ${cat.name}\n\n${cat.belongs || ''}\n\n## Notes\n<!-- cortex:catalog:start -->\n<!-- cortex:catalog:end -->\n`;
}
function replaceBlock(text, tag, content) {
  const start = `<!-- cortex:${tag}:start -->`; const end = `<!-- cortex:${tag}:end -->`;
  const i = text.indexOf(start); const j = text.indexOf(end);
  if (i < 0 || j < i) return `${text.trimEnd()}\n\n${start}\n${content}\n${end}\n`;
  return text.slice(0, i + start.length) + `\n${content}\n` + text.slice(j);
}
function reindex(vault) {
  const cats = loadCategories(vault);
  if (!cats.length) fail('no categories found in _meta/categories.md');
  for (const c of cats) {
    fs.mkdirSync(path.join(vault, c.slug), { recursive: true });
    const hub = path.join(vault, c.slug, `${hubName(c)}.md`);
    if (!fs.existsSync(hub)) fs.writeFileSync(hub, hubTemplate(c));
  }
  const { notes, files } = scanVault(vault);
  const rows = [];
  for (const c of cats) {
    const members = notes.filter((n) => n.top === c.slug && n.fm.type !== 'hub' && n.fm.status !== 'archived');
    const byType = new Map();
    for (const n of members) { const k = n.fm.type || 'untyped'; if (!byType.has(k)) byType.set(k, []); byType.get(k).push(n); }
    const lines = [];
    for (const [type, arr] of [...byType].sort()) {
      lines.push(`### ${type} (${arr.length})`);
      arr.sort((a, b) => String(a.fm.status).localeCompare(String(b.fm.status)) || a.name.localeCompare(b.name));
      for (const n of arr) lines.push(`- [[${n.name}]] · ${n.fm.status || '?'}${n.fm.description ? ` · ${String(n.fm.description).replace(/\s+/g, ' ')}` : ''}`);
      lines.push('');
    }
    const hub = path.join(vault, c.slug, `${hubName(c)}.md`);
    writeIfChanged(hub, replaceBlock(readText(hub), 'catalog', lines.length ? lines.join('\n').trimEnd() : '_No notes yet._'));
    rows.push(`| [[${hubName(c)}\\|${c.name}]] | ${members.length} | ${c.decay} | ${(c.belongs || '').split('. ')[0].replace(/\|/g, '/')} |`);
  }
  const count = (prefix, ext = '.md') => files.filter((f) => f.rel.startsWith(prefix) && f.rel.endsWith(ext)).length;
  const inboxCount = files.filter((f) => f.rel.startsWith('inbox/')).length;
  const content = ['| Category | Notes | Decay | Holds |', '|---|---|---|---|', ...rows, '',
    `Inbox: ${inboxCount} · Journal: ${count('journal/')} days · Archive: ${count('archive/')} notes`].join('\n');
  const idx = path.join(vault, 'index.md');
  const base = fs.existsSync(idx) ? readText(idx) : '# Index\n\nMap of this vault. The table is generated by `cortex reindex`; text outside the markers is kept.\nAgents: start here, then open the hub for the category you need.\n';
  writeIfChanged(idx, replaceBlock(base, 'index', content));
  return { categories: cats.length, notes: notes.filter((n) => cats.some((c) => c.slug === n.top) && n.fm.type !== 'hub').length };
}

// ---------- archive / restore ----------

function moveNote(vault, rel, destRel, mutate) {
  const src = path.join(vault, rel); const dest = path.join(vault, destRel);
  if (!fs.existsSync(src)) throw new Error(`not found: ${rel}`);
  if (fs.existsSync(dest)) throw new Error(`already exists: ${destRel}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, mutate(readText(src)));
  fs.unlinkSync(src);
  const access = loadAccess(vault);
  if (access[rel]) { access[destRel] = access[rel]; delete access[rel]; writeJson(meta(vault, 'access.json'), access); }
}
function normRel(vault, p) { return toPosix(path.relative(vault, path.resolve(vault, p))); }
function archiveCmd(vault, paths) {
  const cats = new Set(loadCategories(vault).map((c) => c.slug)); let ok = 0;
  for (const p of paths) {
    const rel = normRel(vault, p); const top = rel.split('/')[0];
    try {
      if (!cats.has(top)) throw new Error(`${rel} is not inside a category folder`);
      moveNote(vault, rel, `archive/${rel}`, (txt) => {
        const prev = splitFrontmatter(txt).fm?.status;
        let out = setField(txt, 'status', 'archived');
        out = setField(out, 'archived', today());
        if (prev && prev !== 'archived') out = setField(out, 'archived_from_status', prev);
        return out;
      });
      appendLog(vault, 'archive', rel); console.log(`archived ${rel}`); ok++;
    } catch (e) { console.error(`skip: ${e.message}`); }
  }
  if (ok) reindex(vault);
}
function restoreCmd(vault, paths) {
  let ok = 0;
  for (const p of paths) {
    const rel = normRel(vault, p);
    try {
      if (!rel.startsWith('archive/')) throw new Error(`${rel} is not inside archive/`);
      const dest = rel.slice('archive/'.length);
      moveNote(vault, rel, dest, (txt) => {
        const prev = splitFrontmatter(txt).fm?.archived_from_status || 'active';
        let out = setField(txt, 'status', prev);
        out = setField(out, 'updated', today());
        return out.replace(/^archived(_from_status)?:.*\r?\n/gm, '');
      });
      appendLog(vault, 'restore', dest); console.log(`restored ${dest}`); ok++;
    } catch (e) { console.error(`skip: ${e.message}`); }
  }
  if (ok) reindex(vault);
}

// ---------- hooks ----------

function hookPrompt(vault) {
  let input = {}; try { input = JSON.parse(readStdin() || '{}'); } catch {}
  const cfg = loadConfig(vault); const due = isDue(vault, cfg); const t = today();
  if (!due.daily && !due.weekly) return;
  const s = due.state; const sid = input.session_id || input.conversationId || 'unknown';
  if (s.nudged_date === t && s.nudged_session === sid) return;
  const p = writePlan(vault, { weekly: due.weekly });
  const n = planCount(p);
  s.nudged_date = t; s.nudged_session = sid;
  if (due.daily && n === 0) { s.last_daily = t; s.last_daily_result = 'nothing-to-do'; }
  saveState(vault, s);
  const parts = [];
  if (due.daily && n > 0) parts.push(`Cortex daily maintenance has not run today (last run: ${s.last_daily || 'never'}). The cleanup plan at _meta/maintenance-plan.md proposes ${n} item(s); ${p.deferred} more are deferred.`);
  if (due.weekly) parts.push(`The Cortex weekly review is also due (last run: ${s.last_weekly || 'never'}).`);
  if (!parts.length) return;
  parts.push('Per AGENTS.md and the cortex-maintenance skill, the summary is shown to the user after their current request is handled, and nothing is applied until they approve.');
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: parts.join(' ') } }));
}
function hookRead(vault) {
  let input = {}; try { input = JSON.parse(readStdin() || '{}'); } catch { return; }
  const fp = input.tool_input?.file_path || input.tool_input?.path;
  if (fp) touchPaths(vault, [fp]);
}

// ---------- setup ----------

const GITIGNORE_LINES = ['.engine', 'private/', '.trash/', '_meta/maintenance-plan.json', '_meta/maintenance-plan.md', '.obsidian/workspace*.json', '.obsidian/cache', '.DS_Store', 'Thumbs.db'];

function mergeHooks(settings, event, entry, matcher) {
  settings.hooks = settings.hooks || {};
  const list = (settings.hooks[event] || []).filter((g) => !JSON.stringify(g).includes(HOOK_MARK));
  list.push(matcher ? { matcher, hooks: [entry] } : { hooks: [entry] });
  settings.hooks[event] = list;
}
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name); const d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d); else writeIfChanged(d, readText(s));
  }
}
function syncSkills(vault) {
  const src = path.join(ENGINE, 'skills');
  const names = fs.readdirSync(src, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  for (const target of ['.claude/skills', '.agents/skills']) {
    const dir = path.join(vault, target);
    fs.mkdirSync(dir, { recursive: true });
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory() && e.name.startsWith('cortex-') && !names.includes(e.name)) fs.rmSync(path.join(dir, e.name), { recursive: true, force: true });
    }
    for (const n of names) copyDir(path.join(src, n), path.join(dir, n));
  }
  return names;
}
function setup(vault) {
  const t = today();
  for (const d of ['inbox', 'journal', 'archive', 'private', '_meta']) fs.mkdirSync(path.join(vault, d), { recursive: true });
  for (const d of ['inbox', 'journal', 'archive', 'private']) { const keep = path.join(vault, d, '.gitkeep'); if (!fs.existsSync(keep)) fs.writeFileSync(keep, ''); }

  // user-owned files: create once, never overwrite
  const tm = path.join(ENGINE, 'templates', 'meta');
  for (const f of fs.readdirSync(tm)) { const dest = meta(vault, f); if (!fs.existsSync(dest)) fs.copyFileSync(path.join(tm, f), dest); }
  if (!fs.existsSync(meta(vault, 'state.json'))) saveState(vault, { last_daily: t, last_weekly: t, created: t });
  if (!fs.existsSync(meta(vault, 'access.json'))) writeJson(meta(vault, 'access.json'), {});

  // engine-owned generated files: always regenerated
  writeIfChanged(path.join(vault, 'AGENTS.md'), readText(path.join(ENGINE, 'templates', 'AGENTS.md')));
  writeIfChanged(path.join(vault, 'CLAUDE.md'), readText(path.join(ENGINE, 'templates', 'CLAUDE.md')));
  const skills = syncSkills(vault);

  const gi = path.join(vault, '.gitignore');
  const cur = fs.existsSync(gi) ? readText(gi) : '# Cortex vault\n';
  const missing = GITIGNORE_LINES.filter((l) => !cur.split(/\r?\n/).includes(l));
  if (missing.length) fs.writeFileSync(gi, cur.trimEnd() + '\n' + missing.join('\n') + '\n');

  const scriptArg = '${CLAUDE_PROJECT_DIR}/.engine/scripts/cortex.mjs';
  const cs = path.join(vault, '.claude', 'settings.json');
  const settings = readJson(cs, {});
  mergeHooks(settings, 'UserPromptSubmit', { type: 'command', command: 'node', args: [scriptArg, 'hook', 'prompt'], timeout: 15 });
  mergeHooks(settings, 'PostToolUse', { type: 'command', command: 'node', args: [scriptArg, 'hook', 'read'], timeout: 10 }, 'Read');
  settings.permissions = settings.permissions || {};
  const deny = new Set(settings.permissions.deny || []);
  for (const r of ['Read(./private/**)', 'Edit(./private/**)']) deny.add(r);
  settings.permissions.deny = [...deny];
  writeJson(cs, settings);

  const ch = path.join(vault, '.codex', 'hooks.json');
  const codex = readJson(ch, {});
  mergeHooks(codex, 'UserPromptSubmit', { type: 'command', command: 'node .engine/scripts/cortex.mjs hook prompt' });
  writeJson(ch, codex);

  const r = reindex(vault);
  return { skills, ...r };
}

// ---------- init / relink (run from the cortex-engine folder) ----------

// Creates a vault (or re-links an existing one) whose `.engine` points at this engine folder.
// Notes live only in the vault; the engine stays its own repo that you push to GitHub yourself.
function init(args) {
  const noGit = takeFlag(args, '--no-git');
  const target = args[0]; if (!target) fail('usage: node scripts/cortex.mjs init <vault-folder> [--no-git]');
  const vault = path.resolve(target);
  if (vault === ENGINE || vault.startsWith(ENGINE + path.sep)) fail('the vault must be outside the engine folder');
  const existing = fs.existsSync(meta(vault, 'categories.md'));
  if (!existing && fs.existsSync(vault) && fs.readdirSync(vault).length) fail(`${vault} exists, is not empty, and is not a Cortex vault`);
  fs.mkdirSync(vault, { recursive: true });
  const link = path.join(vault, '.engine');
  let st = null; try { st = fs.lstatSync(link); } catch {}
  if (st && !st.isSymbolicLink()) fail(`${link} exists and is not a link; remove it first`);
  if (st) { try { fs.unlinkSync(link); } catch { fs.rmdirSync(link); } } // removes the link only, never the target
  fs.symlinkSync(ENGINE, link, 'junction'); // junction on Windows (no admin needed), directory symlink elsewhere
  const r = spawnSync(process.execPath, [path.join(link, 'scripts', 'cortex.mjs'), 'setup', '--vault', vault], { cwd: vault, stdio: 'inherit' });
  if (r.status !== 0) fail('setup failed');
  if (!existing && !noGit && !tryGit(vault, ['rev-parse', '--git-dir'])) {
    git(vault, ['init', '-q']);
    git(vault, ['add', '-A']);
    git(vault, ['commit', '-q', '-m', 'cortex: new vault']);
  }
  console.log(existing
    ? `\nRe-linked ${vault}/.engine -> ${ENGINE}`
    : `\nVault ready at ${vault} (.engine -> ${ENGINE})\nNext: open a terminal in the vault and run your agent (e.g. \`claude\`). Optionally open the folder in Obsidian.\nThe vault's git history is local only. Your notes are never pushed anywhere unless you add a remote yourself.`);
}

// ---------- engine safety check (run before pushing the engine repo) ----------

function walkEngine(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) walkEngine(abs, out); else out.push(abs);
  }
  return out;
}
function checkEngine(args) {
  if (takeFlag(args, '--install-hook')) {
    const hooksDir = tryGit(ENGINE, ['rev-parse', '--git-path', 'hooks']);
    if (!hooksDir) fail('the engine folder is not a git repo');
    const hook = path.resolve(ENGINE, hooksDir, 'pre-push');
    fs.writeFileSync(hook, '#!/bin/sh\n# Installed by cortex: refuse to push the engine if it contains vault data or secrets\nexec node scripts/cortex.mjs check-engine\n', { mode: 0o755 });
    console.log(`Installed pre-push hook: ${hook}`);
    return;
  }
  const bad = []; const secrets = [];
  for (const e of fs.readdirSync(ENGINE)) if (e !== '.git' && !ENGINE_ALLOWED.has(e)) bad.push(e);
  for (const abs of walkEngine(ENGINE)) {
    const rel = toPosix(path.relative(ENGINE, abs));
    // tests/ deliberately contains a fake (Luhn-valid) card number to check redaction
    if (rel.startsWith('tests/') || !/\.(md|mjs|js|json|txt)$/i.test(rel)) continue;
    for (const s of secretFindings(readText(abs))) secrets.push(`${rel}: ${s}`);
  }
  if (bad.length || secrets.length) {
    console.error('Engine safety check FAILED. Do not push.');
    for (const b of bad) console.error(`  unexpected top-level entry (vault data?): ${b}`);
    for (const s of secrets) console.error(`  ${s}`);
    process.exit(1);
  }
  console.log('Engine safety check passed: only engine files, no secrets found.');
}

// ---------- status ----------

function status(vault) {
  const cfg = loadConfig(vault); const cats = loadCategories(vault); const due = isDue(vault, cfg);
  const { notes, files } = scanVault(vault);
  console.log(`Cortex vault: ${vault}`);
  for (const c of cats) console.log(`  ${c.slug.padEnd(14)} ${String(notes.filter((n) => n.top === c.slug && n.fm.type !== 'hub').length).padStart(4)} notes  (${c.decay})`);
  const inbox = files.filter((f) => f.rel.startsWith('inbox/') && !f.rel.endsWith('.gitkeep'));
  const cands = new Map();
  for (const n of notes.filter((x) => x.top === 'inbox')) { const k = n.fm.candidate_category || '(raw)'; cands.set(k, (cands.get(k) || 0) + 1); }
  console.log(`  inbox ${inbox.length}${cands.size ? '  candidates: ' + [...cands].map(([k, v]) => `${k}×${v}`).join(', ') : ''}`);
  console.log(`  last daily: ${due.state.last_daily || 'never'} · last weekly: ${due.state.last_weekly || 'never'}`);
  if (due.daily) console.log('MAINTENANCE DUE (daily): run `cortex plan` and follow the cortex-maintenance skill.');
  if (due.weekly) console.log('MAINTENANCE DUE (weekly): offer the cortex-weekly-review skill.');
}

// ---------- main ----------

const HELP = `Cortex: agent-operated second brain
Usage: node .engine/scripts/cortex.mjs <command> [--vault <path>]

  status                   counts, inbox candidates, whether maintenance is due
  plan [--weekly]          write _meta/maintenance-plan.md/.json (proposals only)
  reindex                  rebuild hub catalogs + index.md; create folders/hubs for new categories
  lint [--json]            check note format, links, duplicates, possible secrets
  archive <path...>        move notes to archive/<category>/ and mark archived
  restore <path...>        move archived notes back to their category
  touch <path...>          mark notes as used (resets decay)
  done daily|weekly [--skipped]   record that maintenance ran (or was skipped)
  setup                    create missing vault files and regenerate engine-owned files
  hook prompt|read         used by agent hooks; reads JSON on stdin

Run from the cortex-engine folder (node scripts/cortex.mjs ...):
  init <folder> [--no-git] create a vault linked to this engine (or re-link an existing vault)
  check-engine [--install-hook]   verify the engine has no vault data or secrets before you push it`;

function main() {
  const args = process.argv.slice(2);
  const cmd = args.shift();
  if (!cmd || cmd === 'help' || cmd === '--help') { console.log(HELP); return; }
  if (cmd === 'init') return init(args);
  if (cmd === 'check-engine') return checkEngine(args);
  if (cmd === 'hook') {
    // hooks must never break the agent: stay silent outside a vault and swallow every error
    try { const vault = resolveVault(args, { quiet: true }); if (!vault) return; const which = args[0]; if (which === 'prompt') hookPrompt(vault); else if (which === 'read') hookRead(vault); } catch {}
    return;
  }
  const vault = resolveVault(args);
  if (cmd === 'setup') {
    const r = setup(vault);
    console.log(`Setup complete: ${r.categories} categories, ${r.notes} notes, skills: ${r.skills.join(', ')}`);
    return;
  }
  if (!fs.existsSync(meta(vault, 'categories.md'))) fail(`${vault} is not set up yet. Run: node .engine/scripts/cortex.mjs setup`);
  switch (cmd) {
    case 'status': return status(vault);
    case 'plan': { const p = writePlan(vault, { weekly: takeFlag(args, '--weekly') }); console.log(planMarkdown(p)); return; }
    case 'reindex': { const r = reindex(vault); console.log(`Reindexed ${r.categories} categories, ${r.notes} notes.`); return; }
    case 'lint': {
      const json = takeFlag(args, '--json'); const r = lint(vault);
      if (json) { console.log(JSON.stringify(r, null, 2)); return; }
      for (const [label, arr] of [['ERROR', r.errors], ['WARN', r.warnings], ['INFO', r.info]]) for (const i of arr) console.log(`${label} [${i.kind}] ${i.path}: ${i.msg}`);
      const wish = r.unresolved.length;
      console.log(`\n${r.errors.length} errors, ${r.warnings.length} warnings, ${wish} linked names without a note (wishlist, fine).`);
      process.exitCode = r.errors.length ? 1 : 0; return;
    }
    case 'archive': return archiveCmd(vault, args);
    case 'restore': return restoreCmd(vault, args);
    case 'touch': touchPaths(vault, args); return;
    case 'done': {
      const which = args[0]; const skipped = args.includes('--skipped'); const s = loadState(vault); const t = today();
      if (which === 'daily') { s.last_daily = t; s.last_daily_result = skipped ? 'skipped' : 'applied'; }
      else if (which === 'weekly') { s.last_weekly = t; s.last_weekly_result = skipped ? 'skipped' : 'applied'; }
      else fail('usage: cortex done daily|weekly [--skipped]');
      saveState(vault, s); console.log(`Recorded ${which} maintenance (${skipped ? 'skipped' : 'applied'}) for ${t}.`); return;
    }
    default: fail(`unknown command "${cmd}". Run with "help".`);
  }
}

main();
