const EXT = /\.(glb|gltf|obj|fbx|stl|usdz|ply|3mf)(\?|#|$)/i;
const key = (id) => `tab_${id}`;
const tkey = (u) => (u || "").split("?")[0];
const active = new Map(); // tabId -> { key, t }
let chain = Promise.resolve();
const queue = (fn) => (chain = chain.then(fn).catch(() => {}));

function nameFromUrl(u) {
  try { return decodeURIComponent(new URL(u).pathname.split("/").pop()).replace(/\.[^.]+$/, "") || "model"; } catch { return "model"; }
}

function addItems(tabId, incoming) {
  if (tabId < 0) return;
  queue(async () => {
    const list = (await chrome.storage.session.get(key(tabId)))[key(tabId)] || [];
    const act = active.get(tabId);
    const fresh = act && act.key && Date.now() - act.t < 6000;
    for (const it of incoming) {
      const tk = tkey(it.thumb);
      const urls = Object.values(it.formats || {});
      let found = list.find((x) =>
        x.id === it.id ||
        (tk && x.tk === tk) ||
        urls.some((u) => Object.values(x.formats).includes(u)));
      // A single item / raw file that arrives right after a card click belongs to that card.
      if (!found && fresh && (it.sniffed || incoming.length === 1)) found = list.find((x) => x.tk === act.key);
      if (found) {
        Object.assign(found.formats, it.formats || {});
        if (!found.thumb && it.thumb) { found.thumb = it.thumb; found.tk = tk; }
        if (found.autoName && !it.sniffed && it.name) { found.name = it.name; found.autoName = false; }
      } else list.push({ ...it, tk, formats: it.formats || {}, autoName: !!(it.sniffed || !it.name) });
    }
    await chrome.storage.session.set({ [key(tabId)]: list });
    chrome.action.setBadgeText({ tabId, text: String(list.length) });
    chrome.action.setBadgeBackgroundColor({ tabId, color: "#6d5efc" });
  });
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  const tabId = sender.tab && sender.tab.id;
  if (tabId === undefined) return;
  if (msg.type === "items") addItems(tabId, msg.items);
  if (msg.type === "active") active.set(tabId, { key: msg.key, t: Date.now() });
  if (msg.type === "cards")
    addItems(tabId, msg.cards.map((c) => ({ id: "card:" + tkey(c.thumb), name: c.name, thumb: c.thumb, formats: {} })));
});

chrome.webRequest.onHeadersReceived.addListener(
  (d) => {
    const type = d.responseHeaders?.find((h) => h.name.toLowerCase() === "content-type")?.value || "";
    if (EXT.test(d.url) || /^model\//i.test(type)) {
      const ext = (d.url.match(EXT)?.[1] || "glb").toLowerCase();
      addItems(d.tabId, [{ id: d.url, name: nameFromUrl(d.url), thumb: "", formats: { [ext]: d.url }, sniffed: true }]);
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === "loading" && info.url) {
    queue(() => chrome.storage.session.remove(key(tabId)));
    chrome.action.setBadgeText({ tabId, text: "" });
  }
});
chrome.tabs.onRemoved.addListener((tabId) => queue(() => chrome.storage.session.remove(key(tabId))));
