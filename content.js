// Forward data captured by inject.js to the background worker.
window.addEventListener("message", (e) => {
  if (e.source !== window || !e.data || !e.data.__meshygrab) return;
  chrome.runtime.sendMessage({ type: "items", items: e.data.items });
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tkey = (u) => (u || "").split("?")[0];
const send = (m) => chrome.runtime.sendMessage(m);

function scrollParent(el) {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY;
    if ((o === "auto" || o === "scroll") && p.scrollHeight > p.clientHeight + 4) return p;
  }
  return document.documentElement;
}

// The side panel = the scroll area holding the most thumbnail images.
function findGrid() {
  const groups = new Map();
  document.querySelectorAll("img").forEach((img) => {
    const w = img.getBoundingClientRect().width;
    if (w < 70 || w > 500) return;
    const sp = scrollParent(img);
    if (!groups.has(sp)) groups.set(sp, []);
    groups.get(sp).push(img);
  });
  let best = null;
  groups.forEach((imgs, sp) => { if (!best || imgs.length > best.imgs.length) best = { sp, imgs }; });
  return best;
}

const imgSrc = (i) => i.currentSrc || i.src;
const findImg = (k) => [...document.querySelectorAll("img")].find((i) => tkey(imgSrc(i)) === k);

// Scroll the panel top to bottom and collect every card thumbnail on the current page.
async function collectPage(sink) {
  let grid = findGrid();
  if (!grid) return [];
  const sp = grid.sp, keys = [];
  sp.scrollTop = 0;
  await sleep(400);
  for (let i = 0; i < 60; i++) {
    grid = findGrid() || grid;
    grid.imgs.forEach((img) => {
      const t = imgSrc(img);
      if (!t || t.startsWith("data:")) return;
      const k = tkey(t);
      if (!sink.has(k)) { sink.set(k, { thumb: t, name: (img.alt || img.title || "").trim() }); keys.push(k); }
    });
    const before = sp.scrollTop;
    sp.scrollTop += sp.clientHeight * 0.8;
    await sleep(450);
    if (Math.abs(sp.scrollTop - before) < 2) break;
  }
  return keys;
}

// Finds the "1/2" page indicator and the arrow after it.
function pager() {
  for (const el of document.querySelectorAll("div,span,p,button,input")) {
    if (el.children.length) continue;
    const m = (el.value ?? el.textContent ?? "").trim().match(/^(\d+)\s*\/\s*(\d+)$/);
    if (m) return { el, cur: +m[1], total: +m[2] };
  }
  return null;
}
function clickNext(el) {
  const n = el.nextElementSibling || (el.parentElement && el.parentElement.nextElementSibling);
  if (!n) return false;
  (n.matches("button") ? n : n.querySelector("button") || n).click();
  return true;
}

async function readAll() {
  const sink = new Map();
  for (let guard = 0; guard < 30; guard++) {
    const pg = pager();
    send({ type: "progress", text: pg ? `Reading page ${pg.cur}/${pg.total}…` : "Reading cards…" });
    const keys = await collectPage(sink);
    send({ type: "cards", cards: [...sink.values()] });
    // Click each card once so the page loads its model file; background links the file to the card.
    for (let i = 0; i < keys.length; i++) {
      const img = findImg(keys[i]);
      if (!img) continue;
      send({ type: "progress", text: `Loading model ${i + 1}/${keys.length}${pg ? ` (page ${pg.cur}/${pg.total})` : ""}…` });
      send({ type: "active", key: keys[i] });
      img.scrollIntoView({ block: "center" });
      img.click();
      await sleep(1500);
    }
    if (!pg || pg.cur >= pg.total || !clickNext(pg.el)) break;
    await sleep(1500);
  }
  send({ type: "active", key: "" });
  return sink.size;
}

chrome.runtime.onMessage.addListener((msg, _s, reply) => {
  if (msg.type === "readAll") {
    readAll().then((n) => reply({ ok: true, n })).catch((e) => reply({ ok: false, error: String(e) }));
    return true;
  }
});
