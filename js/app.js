/* Loads content/*.md files and renders them into the page. */

const $ = (id) => document.getElementById(id);

async function loadMd(name) {
  const res = await fetch(`content/${name}.md`);
  if (!res.ok) throw new Error(`content/${name}.md not found`);
  return res.text();
}

/* --- tiny markdown helpers --- */

function inline(text) {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

/* Split markdown into simple blocks: h1/h2/h3, ul, table, quote, p */
function parseBlocks(md) {
  const blocks = [];
  const lines = md.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    let m;
    if ((m = line.match(/^(#{1,3})\s+(.*)/))) {
      blocks.push({ type: "h" + m[1].length, text: m[2].trim() });
      i++;
    } else if (/^\s*-\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*-\s+/, "").trim());
        i++;
      }
      blocks.push({ type: "ul", items });
    } else if (/^\s*\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        const cells = lines[i].trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
        if (!cells.every(c => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i++;
      }
      blocks.push({ type: "table", rows });
    } else if (/^\s*>/.test(line)) {
      blocks.push({ type: "quote", text: line.replace(/^\s*>\s?/, "").trim() });
      i++;
    } else {
      blocks.push({ type: "p", text: line.trim().replace(/^\\/, "") });
      i++;
    }
  }
  return blocks;
}

/* Parse "key: value" lines from general.md */
function parseSettings(md) {
  const out = {};
  for (const line of md.split(/\r?\n/)) {
    const m = line.match(/^([a-z_]+):\s*(.+)$/i);
    if (m) out[m[1].toLowerCase()] = m[2].trim();
  }
  return out;
}

function initials(name) {
  const words = name.replace(/[\[\]]/g, "").split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
}

/* Split "left — right" list items on em/en dash */
function splitDash(item) {
  const m = item.match(/^(.+?)\s+[—–-]\s+(.+)$/);
  return m ? [m[1].trim(), m[2].trim()] : [item, ""];
}

/* --- section renderers --- */

function renderGeneral(md) {
  const s = parseSettings(md);
  const title = s.title || "Konferenz";
  const fullTitle = s.year ? `${title} ${s.year}` : title;
  document.title = fullTitle;
  $("nav-brand").textContent = title;
  $("hero-title").textContent = fullTitle;
  $("hero-tagline").textContent = s.tagline || "";
  $("hero-date").textContent = s.date || "";
  $("hero-venue").textContent = [s.venue, s.city].filter(Boolean).join(", ");
  if (s.cta_text) { $("hero-cta").textContent = s.cta_text; $("nav-cta").textContent = s.cta_text; }
  if (s.cta_link) { $("hero-cta").href = s.cta_link; $("nav-cta").href = s.cta_link; }
  $("footer-title").textContent = fullTitle;
  $("footer-organizer").textContent = s.organizer || "";
  $("footer-email").textContent = s.email || "";
  $("footer-phone").textContent = s.phone || "";
  $("footer-copy").textContent = `© ${new Date().getFullYear()} ${s.organizer || title}`;
}

function renderSpeakers(md) {
  const blocks = parseBlocks(md);
  let html = "", card = null;
  const close = () => { if (card) html += card + "</div>"; card = null; };
  for (const b of blocks) {
    if (b.type === "h2") {
      close();
      card = `<div class="speaker-card"><div class="speaker-photo">${initials(b.text)}</div><h3>${inline(b.text)}</h3>`;
    } else if (card && b.type === "h3") {
      card += `<div class="speaker-church">${inline(b.text)}</div>`;
    } else if (card && b.type === "p") {
      card += `<p>${inline(b.text)}</p>`;
    }
  }
  close();
  $("speakers-grid").innerHTML = html;
}

function renderSchedule(md) {
  const blocks = parseBlocks(md);
  let html = "", day = null;
  const close = () => { if (day) html += day + "</div>"; day = null; };
  for (const b of blocks) {
    if (b.type === "h2") {
      close();
      day = `<div class="day-card"><h3>${inline(b.text)}</h3>`;
    } else if (day && b.type === "ul") {
      day += "<ul>" + b.items.map(it => {
        const [time, ev] = splitDash(it);
        return `<li><span class="time">${inline(time)}</span><span>${inline(ev)}</span></li>`;
      }).join("") + "</ul>";
    }
  }
  close();
  $("schedule-grid").innerHTML = html;
}

function renderSeminars(md) {
  const blocks = parseBlocks(md);
  let html = "", group = null;
  const close = () => { if (group) html += group + "</div>"; group = null; };
  for (const b of blocks) {
    if (b.type === "h2") {
      close();
      group = `<div class="seminar-group"><h3>${inline(b.text)}</h3>`;
    } else if (group && b.type === "ul") {
      group += "<ul>" + b.items.map(it => {
        const [who, topic] = splitDash(it);
        return `<li><div class="seminar-speaker">${inline(who)}</div><div class="seminar-topic">${inline(topic)}</div></li>`;
      }).join("") + "</ul>";
    }
  }
  close();
  $("seminars-grid").innerHTML = html;
}

function renderPrices(md) {
  const blocks = parseBlocks(md);
  let html = "", card = null, footnote = "";
  const close = () => { if (card) html += card + "</div>"; card = null; };
  for (const b of blocks) {
    if (b.type === "h2") {
      close();
      card = `<div class="price-card"><h3>${inline(b.text)}</h3>`;
    } else if (card && b.type === "quote") {
      card += `<div class="price-note">${inline(b.text)}</div>`;
    } else if (card && b.type === "table") {
      card += "<table>" + b.rows.map(r =>
        `<tr>${r.map(c => `<td>${inline(c)}</td>`).join("")}</tr>`).join("") + "</table>";
    } else if (b.type === "p" && b.text.startsWith("*")) {
      footnote = inline(b.text);
    }
  }
  close();
  $("prices-grid").innerHTML = html;
  $("prices-footnote").innerHTML = footnote;
}

function renderLocation(md) {
  const blocks = parseBlocks(md);
  let html = "", card = null;
  const close = () => { if (card) html += card + "</div>"; card = null; };
  for (const b of blocks) {
    if (b.type === "h2") {
      close();
      card = `<div class="location-card"><h3>${inline(b.text)}</h3>`;
    } else if (card && b.type === "p") {
      card += `<p>${inline(b.text)}</p>`;
    } else if (card && b.type === "ul") {
      card += "<ul>" + b.items.map(it => `<li>${inline(it)}</li>`).join("") + "</ul>";
    }
  }
  close();
  $("location-grid").innerHTML = html;
}

function renderGallery(md) {
  const blocks = parseBlocks(md);
  const paths = blocks.filter(b => b.type === "ul").flatMap(b => b.items);
  $("gallery-grid").innerHTML = paths.map(p =>
    `<div class="gallery-item"><img src="${p}" alt="Konferenzfoto"
       onerror="this.parentElement.textContent='[FOTO]'"></div>`).join("");
}

function renderAbout(md) {
  const blocks = parseBlocks(md);
  $("about-body").innerHTML = blocks
    .filter(b => b.type === "p")
    .map(b => `<p>${inline(b.text)}</p>`).join("");
}

/* --- boot --- */

const sections = [
  ["general", renderGeneral],
  ["speakers", renderSpeakers],
  ["schedule", renderSchedule],
  ["seminars", renderSeminars],
  ["prices", renderPrices],
  ["location", renderLocation],
  ["gallery", renderGallery],
  ["about", renderAbout],
];

for (const [name, render] of sections) {
  loadMd(name).then(render).catch(err => console.warn(err.message));
}

$("nav-toggle").addEventListener("click", () => $("nav-links").classList.toggle("open"));
$("nav-links").addEventListener("click", (e) => {
  if (e.target.tagName === "A") $("nav-links").classList.remove("open");
});
