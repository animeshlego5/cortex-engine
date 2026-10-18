#!/usr/bin/env node
// Builds a synthetic Cortex vault for scale testing: node tests/generate-vault.mjs <vault-folder> <note-count> [seed]
// The vault must already exist (create it with `node scripts/cortex.mjs init <folder> --no-git`).
// Writes <vault>/_meta/needles.json: planted facts with the question that should find each one.

import fs from 'node:fs';
import path from 'node:path';

const [vault, countArg, seedArg] = process.argv.slice(2);
if (!vault || !countArg) { console.error('usage: node tests/generate-vault.mjs <vault> <count> [seed]'); process.exit(1); }
const N = Number(countArg);
let seed = Number(seedArg || 42);
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const pad = (n) => String(n).padStart(2, '0');
const dateAgo = (days) => { const d = new Date(Date.UTC(2026, 10, 1) - days * 864e5); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };

const first = ['Aarav', 'Maya', 'Leo', 'Zara', 'Omar', 'Ines', 'Kenji', 'Lena', 'Ravi', 'Sofia', 'Noah', 'Asha', 'Felix', 'Nora', 'Theo', 'Ivy', 'Mateo', 'Hana', 'Ezra', 'Lila'];
const last = ['Shah', 'Park', 'Okafor', 'Silva', 'Novak', 'Haddad', 'Berg', 'Moreau', 'Tanaka', 'Rossi', 'Khan', 'Dubois', 'Costa', 'Weber', 'Lund'];
const adj = ['Quiet', 'Red', 'Hidden', 'Last', 'Silver', 'Broken', 'Endless', 'Paper', 'Winter', 'Golden', 'Hollow', 'Electric', 'Distant', 'Wild', 'Glass'];
const noun = ['River', 'Garden', 'Signal', 'Harbor', 'Engine', 'Mirror', 'Orchard', 'Lantern', 'Atlas', 'Comet', 'Valley', 'Archive', 'Tide', 'Forest', 'Circuit'];
const verbs = ['Renew', 'Book', 'Fix', 'Call', 'Order', 'Return', 'Clean', 'Plan', 'Pay', 'Email', 'Update', 'Sort', 'Print', 'Cancel', 'Check'];
const objs = ['passport', 'dentist', 'bike lights', 'insurance', 'printer ink', 'gym bag', 'library books', 'tax forms', 'phone plan', 'car wash', 'birthday gift', 'plant pots', 'desk lamp', 'router', 'shoes'];
const goalsList = ['Run a Marathon', 'Learn Spanish', 'Save for a House', 'Read 30 Books', 'Get Promoted', 'Sleep Better', 'Learn Piano', 'Pay Off Loan', 'Cook More at Home', 'Travel to Japan'];
const ideaTopics = ['an app that', 'a newsletter about', 'a podcast on', 'a board game where', 'a tool that', 'a zine about'];
const ideaRest = ['tracks shared groceries', 'local history walks', 'rating street food', 'players trade seeds', 'summarises meeting notes', 'night photography'];

function write(rel, fm, body) {
  const f = path.join(vault, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const y = Object.entries(fm).map(([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.map((x) => JSON.stringify(x)).join(', ')}]` : typeof v === 'string' && /[:#\[\]]/.test(v) ? JSON.stringify(v) : v}`).join('\n');
  fs.writeFileSync(f, `---\n${y}\n---\n${body}\n`);
}
const used = new Set();
const uniq = (name) => { let n = name; let i = 2; while (used.has(n.toLowerCase())) n = `${name} (${i++})`; used.add(n.toLowerCase()); return n; };

const people = []; const goals = []; const all = [];
const share = { people: 0.12, goals: 0.02, media: 0.25, todos: 0.2, ideas: 0.12, reference: 0.15, finance: 0.06, things: 0.03, projects: 0.05 };
const counts = Object.fromEntries(Object.entries(share).map(([k, v]) => [k, Math.max(1, Math.round(N * v))]));

for (let i = 0; i < Math.min(counts.goals, goalsList.length); i++) {
  const name = uniq(goalsList[i]); goals.push(name);
  write(`goals/${name}.md`, { type: 'goal', category: 'goals', description: `Goal: ${name.toLowerCase()}`, status: 'active', created: dateAgo(300), updated: dateAgo(30) },
    `# ${name}\n\nA personal goal.\n\n## Timeline\n- ${dateAgo(300)}: Goal set\n\n## Related\n- part_of:: [[Hub - Goals]]`);
}
for (let i = 0; i < counts.people; i++) {
  const name = uniq(`${pick(first)} ${pick(last)}`); people.push(name);
  const role = pick(['friend', 'colleague', 'cousin', 'neighbour', 'client', 'gym buddy']);
  write(`people/${name}.md`, { type: 'person', category: 'people', description: `${role} of the user`, status: 'active', created: dateAgo(Math.floor(rnd() * 700)), updated: dateAgo(Math.floor(rnd() * 200)), role },
    `# ${name}\n\nThe user's ${role}.\n\n## Timeline\n- ${dateAgo(400)}: First mentioned\n\n## Related\n- part_of:: [[Hub - People]]`);
}
const cats = { media: [], todos: [], ideas: [], reference: [], finance: [], things: [], projects: [] };
for (const [cat, n] of Object.entries(counts)) {
  if (cat === 'people' || cat === 'goals') continue;
  for (let i = 0; i < n; i++) {
    const age = Math.floor(rnd() * 900);
    let name; let fm; let body = '';
    const rel = [];
    if (cat === 'media') {
      name = uniq(`The ${pick(adj)} ${pick(noun)}`);
      const type = pick(['movie', 'book', 'show', 'podcast']);
      const status = pick(['want', 'want', 'done', 'in-progress']);
      fm = { type, category: cat, description: `${type} the user ${status === 'want' ? 'wants to try' : 'has seen'}`, status, created: dateAgo(age), updated: dateAgo(Math.max(0, age - 10)) };
      if (rnd() < 0.5 && people.length) rel.push(`recommended_by:: [[${pick(people)}]]`);
    } else if (cat === 'todos') {
      name = uniq(`${pick(verbs)} ${pick(objs)}`);
      const status = pick(['todo', 'done', 'done', 'doing']);
      fm = { type: 'task', category: cat, description: `Task: ${name.toLowerCase()}`, status, created: dateAgo(age), updated: dateAgo(Math.max(0, age - 3)), due: dateAgo(Math.max(-30, age - 14)) };
      if (rnd() < 0.3 && goals.length) rel.push(`supports:: [[${pick(goals)}]]`);
    } else if (cat === 'ideas') {
      name = uniq(`Idea ${pick(ideaTopics)} ${pick(ideaRest)}`.replace(/^Idea a/, 'A'));
      fm = { type: 'idea', category: cat, description: name, status: 'active', created: dateAgo(age), updated: dateAgo(age) };
    } else if (cat === 'reference') {
      name = uniq(`${pick(adj)} ${pick(noun)} ${pick(['Cafe', 'Trail', 'Recipe Tip', 'Shortcut', 'Bookshop', 'Fact'])}`);
      fm = { type: pick(['fact', 'place', 'howto']), category: cat, description: `Reference: ${name.toLowerCase()}`, status: 'active', created: dateAgo(age), updated: dateAgo(age) };
    } else if (cat === 'finance') {
      name = uniq(`${pick(adj)} ${pick(['Card', 'Fund', 'Subscription', 'Savings Account', 'Insurance'])}`);
      fm = { type: pick(['card', 'investment', 'subscription', 'account', 'insurance']), category: cat, description: `Finance item ${name.toLowerCase()}`, status: pick(['active', 'active', 'closed']), created: dateAgo(age), updated: dateAgo(Math.max(0, age - 20)) };
      if (rnd() < 0.4 && goals.length) rel.push(`funds:: [[${pick(goals)}]]`);
    } else if (cat === 'things') {
      name = uniq(`${pick(['Old', 'New', 'Spare', 'Work', 'Home'])} ${pick(['Laptop', 'Bike', 'Camera', 'Kettle', 'Scooter', 'Guitar', 'Monitor'])}`);
      fm = { type: pick(['device', 'vehicle', 'possession']), category: cat, description: `The user's ${name.toLowerCase()}`, status: 'active', created: dateAgo(age), updated: dateAgo(age) };
    } else {
      name = uniq(`${pick(adj)} ${pick(noun)} Project`);
      fm = { type: 'project', category: cat, description: `Project ${name.toLowerCase()}`, status: pick(['active', 'done', 'paused']), created: dateAgo(age), updated: dateAgo(Math.max(0, age - 30)) };
      if (goals.length) rel.push(`supports:: [[${pick(goals)}]]`);
    }
    all.push(`${cat}/${name}.md`);
    write(`${cat}/${name}.md`, fm, `# ${name}\n\n${body || 'Synthetic note for scale testing.'}\n\n## Related\n${[...rel, `part_of:: [[Hub - ${cat[0].toUpperCase() + cat.slice(1)}]]`].map((x) => `- ${x}`).join('\n')}`);
  }
}
// journal: one file per 3 days of history
for (let d = 0; d < Math.min(900, N); d += 3) {
  const day = dateAgo(d);
  write(`journal/${day}.md`, { type: 'journal', created: day }, `# ${day}\n\n## 09:00\nSynthetic journal entry about ${pick(objs)} and ${pick(people) || 'nobody'}.`);
}
// needles: specific facts recall should find
const p1 = people[3] || people[0]; const p2 = people[7] || people[0];
const needles = [
  { q: `What is ${p1}'s favourite tea?`, a: 'smoked lapsang souchong' },
  { q: 'Where did I park at the airport last time?', a: 'level 4, row K' },
  { q: `What book did ${p2} lend me?`, a: 'The Overstory' },
  { q: 'What size are my running shoes?', a: 'EU 43.5' },
  { q: 'Which plumber fixed the boiler?', a: 'Dario from QuickFix' },
];
write(`people/${p1}.md`, { type: 'person', category: 'people', description: `Friend; favourite tea is smoked lapsang souchong`, status: 'active', created: dateAgo(500), updated: dateAgo(400), favourite_tea: 'smoked lapsang souchong' },
  `# ${p1}\n\nFriend. Loves smoked lapsang souchong tea.\n\n## Timeline\n- ${dateAgo(400)}: Mentioned favourite tea\n\n## Related\n- part_of:: [[Hub - People]]`);
write('reference/Airport Parking Spot.md', { type: 'fact', category: 'reference', description: 'Where the car was parked at the airport: level 4, row K', status: 'active', created: dateAgo(250), updated: dateAgo(250) }, '# Airport Parking Spot\n\nParked on level 4, row K.\n\n## Related\n- part_of:: [[Hub - Reference]]');
write('media/The Overstory.md', { type: 'book', category: 'media', description: `Book borrowed from ${p2}`, status: 'in-progress', created: dateAgo(600), updated: dateAgo(500) }, `# The Overstory\n\nBorrowed from [[${p2}]].\n\n## Related\n- recommended_by:: [[${p2}]]\n- part_of:: [[Hub - Media]]`);
write('things/Running Shoes.md', { type: 'possession', category: 'things', description: 'Running shoes, size EU 43.5', status: 'active', created: dateAgo(700), updated: dateAgo(700), size: 'EU 43.5' }, '# Running Shoes\n\nSize EU 43.5.\n\n## Related\n- part_of:: [[Hub - Things]]');
const j = `journal/${dateAgo(620)}.md`;
write(j, { type: 'journal', created: dateAgo(620) }, `# ${dateAgo(620)}\n\n## 18:00\nBoiler broke again. Dario from QuickFix came and fixed it, good guy.`);
fs.writeFileSync(path.join(vault, '_meta', 'needles.json'), JSON.stringify(needles, null, 2));
console.log(`Generated ${all.length + people.length + goals.length} notes, ${Math.ceil(Math.min(900, N) / 3)} journal days, ${needles.length} needles`);
