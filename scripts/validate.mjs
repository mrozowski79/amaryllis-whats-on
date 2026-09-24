import { readFile } from 'node:fs/promises';

const today = new Date().toISOString().slice(0, 10);
const { events = [] } = JSON.parse(await readFile('data/events.json', 'utf8'));
const ids = new Set();
const errors = [];

for (const event of events) {
  if (!event.id || ids.has(event.id)) errors.push(`Duplicate or missing id: ${event.id ?? '(missing)'}`);
  ids.add(event.id);
  if (!event.date || Number.isNaN(Date.parse(event.date))) errors.push(`Invalid date for ${event.id}`);
  if (!event.sourceUrl || !/^https:\/\//.test(event.sourceUrl)) errors.push(`Missing official source URL for ${event.id}`);
  if (!event.title?.en || !event.title?.de) errors.push(`Missing EN or DE title for ${event.id}`);
  if (event.area !== 'Grindelwald' && event.area !== 'Wengen') errors.push(`Invalid area for ${event.id}`);
  if (event.date < today) errors.push(`Expired event still present: ${event.id}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Validated ${events.length} future event(s).`);
