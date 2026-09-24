import { mkdir, readFile, writeFile } from 'node:fs/promises';

const data = JSON.parse(await readFile('data/events.json', 'utf8'));
const sources = JSON.parse(await readFile('data/sources.json', 'utf8'));
const copy = {
  en: { title: "What's On in Grindelwald", intro: 'Browse this month and the next three months at a glance. Select an event to open a concise event page.', updated: 'Last checked', calendar: 'Calendar', agenda: 'Upcoming events', empty: 'The next verified events are being prepared. Please check the official calendars below in the meantime.', nearby: 'Nearby: Wengen', source: 'Official details', sources: 'Official calendars' },
  de: { title: 'Was ist los in Grindelwald?', intro: 'Dieser Monat und die nächsten drei Monate auf einen Blick. Wähle eine Veranstaltung, um eine kompakte Veranstaltungsseite zu öffnen.', updated: 'Zuletzt geprüft', calendar: 'Kalender', agenda: 'Kommende Veranstaltungen', empty: 'Die nächsten verifizierten Veranstaltungen werden gerade vorbereitet. In der Zwischenzeit findest du sie in den offiziellen Kalendern unten.', nearby: 'In der Nähe: Wengen', source: 'Offizielle Informationen', sources: 'Offizielle Kalender' }
};const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const eventSourceName = (event, language) => event.sourceName?.[language] || (event.sourceUrl ? (language === 'de' ? 'Schweiz Tourismus' : 'Switzerland Tourism') : '');
const iso = date => date.toISOString().slice(0, 10);
const today = new Date();
today.setHours(0, 0, 0, 0);
const todayIso = iso(today);
const calendarStart = new Date(today.getFullYear(), today.getMonth(), 1);

function monthGrid(start, language, locale, eventsByDate) {
  const weekdays = language === 'de' ? ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const firstDay = new Date(start.getFullYear(), start.getMonth(), 1);
  const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  const offset = (firstDay.getDay() + 6) % 7;
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(start);
  let cells = '';
  for (let index = 0; index < offset + lastDay.getDate(); index += 1) {
    if (index < offset) { cells += '<div class="day empty-day" aria-hidden="true"></div>'; continue; }
    const day = index - offset + 1;
    const date = new Date(start.getFullYear(), start.getMonth(), day);
    const dateIso = iso(date);
    const isPast = dateIso < todayIso;
    const eventLinks = (eventsByDate.get(dateIso) || []).map(event => '<a class="calendar-event' + (event.area === 'Wengen' ? ' nearby' : '') + '" href="events/' + encodeURIComponent(event.id) + '/" target="_blank" rel="noopener noreferrer">' + esc(event.title[language]) + (eventSourceName(event, language) ? '<small>' + esc(eventSourceName(event, language)) + '</small>' : '') + '</a>').join('');
    cells += '<div class="day' + (isPast ? ' past' : '') + (dateIso === todayIso ? ' today' : '') + '"><span class="day-number">' + day + '</span>' + eventLinks + '</div>';
  }
  return '<section class="month" aria-label="' + esc(monthLabel) + '"><h3>' + esc(monthLabel) + '</h3><div class="weekdays">' + weekdays.map(day => '<span>' + day + '</span>').join('') + '</div><div class="month-grid">' + cells + '</div></section>';
}

function render(language) {
  const text = copy[language];
  const locale = language === 'de' ? 'de-CH' : 'en-GB';
  const date = value => new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(value + 'T12:00:00'));
  const ordered = [...(data.events || [])].sort((a, b) => a.date.localeCompare(b.date));
  const eventsByDate = new Map();
  ordered.forEach(event => eventsByDate.set(event.date, [...(eventsByDate.get(event.date) || []), event]));
  const months = Array.from({ length: 4 }, (_, index) => monthGrid(new Date(calendarStart.getFullYear(), calendarStart.getMonth() + index, 1), language, locale, eventsByDate)).join('');
  const agenda = ordered.filter(event => event.date >= todayIso).map(event => '<article class="event' + (event.area === 'Wengen' ? ' nearby' : '') + '" id="event-' + esc(event.id) + '"><p class="date">' + date(event.date) + (event.area === 'Wengen' ? ' <span>' + text.nearby + '</span>' : '') + '</p><h3>' + esc(event.title[language]) + '</h3><p>' + esc(event.description?.[language]) + '</p><a href="' + esc(event.sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + text.source + '</a></article>').join('');
  const links = sources.map(source => '<li><a href="' + esc(source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(source.name) + '</a></li>').join('');
  return '<!doctype html><html lang="' + language + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>' + text.title + ' | Amaryllis Grindelwald</title><style>:root{--forest:#173b35;--green:#0a6e61;--paper:#f7f6f2;--line:#d9e2df;--warm:#a06b20;--nearby:#b88332;--muted:#6b7976}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--forest);font-family:Arial,sans-serif;line-height:1.5}main{max-width:1180px;margin:auto;padding:54px 24px}h1{font-size:42px;line-height:1.1;margin:0 0 12px}.intro{font-size:19px;max-width:720px;margin:0}.updated{color:var(--muted);font-size:14px;margin:24px 0 36px}h2{font-size:28px;margin:0 0 18px}.calendar{display:grid;gap:30px}.month{background:#fff;border:1px solid var(--line);padding:22px}.month h3{font-size:24px;margin:0 0 16px}.weekdays,.month-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr))}.weekdays{border-bottom:1px solid var(--line);color:var(--muted);font-weight:bold;font-size:13px}.weekdays span{padding:0 8px 9px}.day{min-height:128px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:8px;display:flex;flex-direction:column;gap:5px}.day:nth-child(7n){border-right:0}.empty-day,.past{background:#fafaf8}.day-number{font-weight:bold;color:var(--forest)}.today .day-number{width:28px;height:28px;display:grid;place-items:center;background:var(--forest);color:#fff;border-radius:50%}.past .day-number{color:#9ba7a4}.calendar-event{display:block;border-left:3px solid var(--green);background:#eef7f5;color:#07564c;font-size:12px;font-weight:bold;line-height:1.25;padding:4px 5px;text-decoration:none}.calendar-event.nearby{border-color:var(--nearby);background:#fdf6ea;color:#77501b}.past .calendar-event{opacity:.48;pointer-events:none}.agenda{margin-top:50px}.event-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.event{scroll-margin-top:20px;background:#fff;border:1px solid var(--line);padding:20px}.event.nearby{border-left:5px solid var(--nearby)}.event h3{margin:4px 0 8px;font-size:21px}.event p{margin:0 0 12px}.date{font-weight:bold;color:var(--warm)}.date span{display:inline-block;color:#74551e;font-size:13px;margin-left:6px}.event a,footer a{color:var(--green);font-weight:bold}footer{border-top:1px solid var(--line);margin-top:50px;padding-top:24px}footer h2{font-size:22px}footer ul{padding-left:20px}@media(max-width:760px){main{padding:34px 14px}h1{font-size:32px}.month{padding:14px}.day{min-height:86px;padding:5px}.weekdays{font-size:11px}.weekdays span{padding:0 3px 7px}.calendar-event{font-size:10px;padding:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.event-grid{grid-template-columns:1fr}}@media(max-width:430px){.day{min-height:69px}.day-number{font-size:13px}.calendar-event{font-size:9px}.month h3{font-size:20px}}</style></head><body><main><header><h1>' + text.title + '</h1><p class="intro">' + text.intro + '</p><p class="updated">' + text.updated + ': ' + (data.updatedAt || '—') + '</p></header><section><h2>' + text.calendar + '</h2><div class="calendar">' + months + '</div></section><footer><h2>' + text.sources + '</h2><ul>' + links + '</ul></footer></main></body></html>';
}


function renderEvent(language, event) {
  const text = copy[language];
  const locale = language === 'de' ? 'de-CH' : 'en-GB';
  const date = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(event.date + 'T12:00:00'));
  const meta = date + (event.area === 'Wengen' ? ' · ' + text.nearby : '');
  const action = event.sourceUrl
    ? '<a class="official" href="' + esc(event.sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + text.source + '</a>'
    : '<p class="unavailable">' + (language === 'de' ? 'Eine offizielle Veranstaltungsseite ist derzeit nicht verfügbar.' : 'An official event page is not currently available.') + '</p>';
  return '<!doctype html><html lang="' + language + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>' + esc(event.title[language]) + ' | Amaryllis Grindelwald</title><style>:root{--forest:#173b35;--green:#0a6e61;--paper:#f7f6f2;--line:#d9e2df;--warm:#a06b20;--muted:#6b7976}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--forest);font-family:Arial,sans-serif;line-height:1.55}main{max-width:760px;margin:auto;padding:56px 24px}.back{color:var(--green);font-weight:bold;text-decoration:none}article{margin-top:28px;background:#fff;border:1px solid var(--line);padding:30px}.meta{color:var(--warm);font-weight:bold;margin:0 0 12px}h1{font-size:38px;line-height:1.15;margin:0 0 18px}p{font-size:18px}.official{display:inline-block;margin-top:12px;background:var(--green);color:#fff;text-decoration:none;font-weight:bold;padding:12px 16px}.unavailable{color:var(--muted);font-size:16px}@media(max-width:560px){main{padding:32px 16px}article{padding:22px}h1{font-size:31px}}</style></head><body><main><a class="back" href="../../">' + (language === 'de' ? '← Zurück zum Kalender' : '← Back to calendar') + '</a><article><p class="meta">' + esc(meta) + '</p><h1>' + esc(event.title[language]) + '</h1><p>' + esc(event.description?.[language] || '') + '</p>' + action + '</article></main></body></html>';
}

for (const language of ['en', 'de']) {
  await mkdir('public/' + language, { recursive: true });
  await writeFile('public/' + language + '/index.html', render(language));
  for (const event of data.events || []) {
    const directory = 'public/' + language + '/events/' + encodeURIComponent(event.id);
    await mkdir(directory, { recursive: true });
    await writeFile(directory + '/index.html', renderEvent(language, event));
  }
}
await writeFile('public/index.html', '<!doctype html><meta http-equiv="refresh" content="0; url=en/">');
console.log('Rendered ' + (data.events || []).length + ' event(s).');
