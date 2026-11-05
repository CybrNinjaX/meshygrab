const $ = (id) => document.getElementById(id);
let tabId = null, items = [];
const selected = new Set();
const safe = (s) => String(s).replace(/[^\w\- ]+/g, "_").trim().slice(0, 60) || "model";
const label = (it, i) => it.name || `Model ${i + 1}`;

$("signIn").onclick = () => chrome.tabs.create({ url: "https://www.meshy.ai/" });
$("continue").onclick = async () => {
  $("login").hidden = true;
  $("step1").hidden = false;
  await load();
};

async function load() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  tabId = tab.id;
  items = (await chrome.storage.session.get(`tab_${tabId}`))[`tab_${tabId}`] || [];
  render();
}
chrome.storage.onChanged.addListener((ch, area) => {
  if (area === "session" && tabId !== null && ch[`tab_${tabId}`]) { items = ch[`tab_${tabId}`].newValue || []; render(); }
});
chrome.runtime.onMessage.addListener((m) => { if (m.type === "progress") $("progress").textContent = m.text; });

function render() {
  const list = $("list");
  list.innerHTML = "";
  $("count").textContent = items.length;
  if (!items.length) list.innerHTML = '<div class="empty">No models yet.<br>Open Meshy, then press “Read all cards”.</div>';
  items.forEach((it, i) => {
    const row = document.createElement("label");
    row.className = "card" + (selected.has(it.id) ? " on" : "");
    row.innerHTML = '<input type="checkbox" /><div class="preview"><img class="thumb" /><span class="preview-empty"></span></div><div class="info"><div class="name"></div><div class="chips"></div></div>';
    const cb = row.querySelector("input");
    cb.checked = selected.has(it.id);
    cb.onchange = () => { cb.checked ? selected.add(it.id) : selected.delete(it.id); row.classList.toggle("on", cb.checked); sync(); };
    const img = row.querySelector("img");
    const preview = row.querySelector(".preview");
    const empty = row.querySelector(".preview-empty");
    empty.textContent = it.thumb ? "Preview could not be loaded" : "No preview available";
    if (it.thumb) {
      img.onload = () => preview.classList.add("has-image");
      img.onerror = () => { img.removeAttribute("src"); preview.classList.remove("has-image"); };
      img.alt = label(it, i);
      img.src = it.thumb;
      if (img.complete && img.naturalWidth) preview.classList.add("has-image");
    }
    row.querySelector(".name").textContent = label(it, i);
    const chips = row.querySelector(".chips");
    const fm = Object.keys(it.formats);
    (fm.length ? fm : ["no file yet"]).forEach((f) => {
      const c = document.createElement("span");
      c.className = "chip" + (fm.length ? "" : " none");
      c.textContent = f;
      chips.appendChild(c);
    });
    list.appendChild(row);
  });
  sync();
}

function sync() {
  $("next").disabled = selected.size === 0;
  $("selAll").checked = items.length > 0 && selected.size === items.length;
}
$("selAll").onchange = (e) => { items.forEach((it) => (e.target.checked ? selected.add(it.id) : selected.delete(it.id))); render(); };

$("read").onclick = async () => {
  $("read").disabled = true;
  $("progress").textContent = "Starting…";
  try {
    const r = await chrome.tabs.sendMessage(tabId, { type: "readAll" });
    $("progress").textContent = r?.ok ? `Done. ${r.n} cards read.` : "Could not read: " + (r?.error || "unknown error");
    items.forEach((it) => selected.add(it.id)); // select everything by default
    render();
  } catch {
    $("progress").textContent = "Reload the Meshy page once, then try again.";
  }
  $("read").disabled = false;
};

const chosen = () => items.filter((it) => selected.has(it.id));

$("next").onclick = () => {
  const counts = {};
  chosen().forEach((it) => Object.keys(it.formats).forEach((f) => (counts[f] = (counts[f] || 0) + 1)));
  const box = $("formats");
  box.innerHTML = "";
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!entries.length) box.innerHTML = '<div class="empty">No download links were captured for the selected models.<br>Go back and press “Read all cards” again.</div>';
  entries.forEach(([f, n], i) => {
    const row = document.createElement("label");
    row.className = "card";
    row.innerHTML = '<input type="radio" name="fmt" /><div class="info"><div class="name"></div></div>';
    row.querySelector("input").value = f;
    row.querySelector("input").checked = i === 0;
    row.querySelector(".name").textContent = `${f.toUpperCase()}  ·  ${n} of ${selected.size} models`;
    box.appendChild(row);
  });
  $("go").disabled = !entries.length;
  $("status").textContent = "";
  $("step1").hidden = true; $("step2").hidden = false;
};
$("back").onclick = () => { $("step2").hidden = true; $("step1").hidden = false; };

$("go").onclick = () => {
  const f = document.querySelector('input[name="fmt"]:checked')?.value;
  if (!f) return;
  let ok = 0, skipped = 0;
  items.forEach((it, i) => {
    if (!selected.has(it.id)) return;
    const url = it.formats[f];
    if (!url) { skipped++; return; }
    chrome.downloads.download({ url, filename: `MeshyGrab/${safe(label(it, i))}.${f}`, conflictAction: "uniquify" });
    ok++;
  });
  $("status").textContent = `Started ${ok} download${ok === 1 ? "" : "s"}` + (skipped ? `, ${skipped} skipped (no ${f.toUpperCase()})` : "") + ".";
};

