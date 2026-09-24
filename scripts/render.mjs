import { mkdir, readFile, writeFile } from 'node:fs/promises';

const data = JSON.parse(await readFile('data/events.json', 'utf8'));
const sources = JSON.parse(await readFile('data/sources.json', 'utf8'));
const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const copy = {
  en: { title: "What's On in Grindelwald", intro: 'Upcoming events and seasonal highlights in Grindelwald, with a small selection from nearby Wengen.', updated: 'Last checked', empty: 'The next verified events are being prepared. Please check the official calendars below in the meantime.', nearby: 'Nearby: Wengen', source: 'Official details', sources: 'Official calendars' },
  de: { title: 'Was ist los in Grindelwald?', intro: 'Kommende Veranstaltungen und saisonale Highlights in Grindelwald, mit einer kleinen Auswahl aus dem nahegelegenen Wengen.', updated: 'Zuletzt geprüft', empty: 'Die nächsten verifizierten Veranstaltungen werden gerade vorbereitet. In der Zwischenzeit findest du sie in den offiziellen Kalendern unten.', nearby: 'In der Nähe: Wengen', source: 'Offizielle Informationen', sources: 'Offizielle Kalender' }
};

function render(language) {
  const text = copy[language];
  const locale = language === 'de' ? 'de-CH' : 'en-GB';
  const date = value => new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value + 'T12:00:00'));
  const events = (data.events || []).map(event => '<article class="event' + (event.area === 'Wengen' ? ' nearby' : '') + '"><p class="date">' + date(event.date) + (event.area === 'Wengen' ? ' · ' + text.nearby : '') + '</p><h2>' + esc(event.title[language]) + '</h2><p>' + esc(event.description?.[language]) + '</p><a href="' + esc(event.sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + text.source + '</a></article>').join('');
  const links = sources.map(source => '<li><a href="' + esc(source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(source.name) + '</a></li>').join('');
  return '<!doctype html><html lang="' + language + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + text.title + ' | Amaryllis Grindelwald</title><style>body{margin:0;background:#f7f6f2;color:#173b35;font-family:Arial,sans-serif;line-height:1.55}main{max-width:900px;margin:auto;padding:56px 24px}h1{font-size:42px;margin:0 0 10px}.intro{font-size:19px;max-width:680px}.updated{color:#61736f;font-size:14px;margin:28px 0}.grid{display:grid;gap:16px}.event{background:#fff;border:1px solid #d9e2df;border-radius:8px;padding:22px}.event.nearby{border-left:5px solid #b88332}.event h2{margin:4px 0 8px;font-size:22px}.date{font-weight:bold;color:#a06b20;margin:0}.event a,footer a{color:#0a6e61;font-weight:bold}footer{border-top:1px solid #d9e2df;margin-top:42px;padding-top:22px}footer ul{padding-left:20px}@media(max-width:600px){main{padding:32px 18px}h1{font-size:32px}}</style></head><body><main><h1>' + text.title + '</h1><p class="intro">' + text.intro + '</p><p class="updated">' + text.updated + ': ' + (data.updatedAt || '—') + '</p><section class="grid">' + (events || '<article class="event"><p>' + text.empty + '</p></article>') + '</section><footer><h2>' + text.sources + '</h2><ul>' + links + '</ul></footer></main></body></html>';
}

for (const language of ['en', 'de']) {
  await mkdir('public/' + language, { recursive: true });
  await writeFile('public/' + language + '/index.html', render(language));
}
await writeFile('public/index.html', '<!doctype html><meta http-equiv="refresh" content="0; url=en/">');
console.log('Rendered ' + (data.events || []).length + ' event(s).');
