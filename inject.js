(() => {
  const RE = /\.(glb|gltf|obj|fbx|stl|usdz|ply|3mf)(\?|#|$)/i;
  const imageUrl = (value) => {
    if (typeof value !== "string" || !value) return "";
    try { return new URL(value, location.href).href; } catch { return ""; }
  };
  function scan(node, out, depth = 0) {
    if (!node || typeof node !== "object" || depth > 8) return;
    if (Array.isArray(node)) { node.forEach((n) => scan(n, out, depth + 1)); return; }
    const formats = {};
    const mu = node.model_urls || node.modelUrls;
    if (mu && typeof mu === "object")
      for (const [k, v] of Object.entries(mu)) if (typeof v === "string" && v.startsWith("http")) formats[k.toLowerCase()] = v;
    for (const v of Object.values(node))
      if (typeof v === "string" && RE.test(v)) { const e = v.match(RE)[1].toLowerCase(); formats[e] = formats[e] || v; }
    if (Object.keys(formats).length) {
      out.push({
        id: String(node.id || node.task_id || Object.values(formats)[0]),
        name: String(node.name || node.title || node.prompt || node.id || "model").slice(0, 80),
        thumb: imageUrl(node.thumbnail_url || node.thumbnail || node.preview_url || node.image_url || node.cover_url || ""),
        formats,
      });
    }
    for (const [k, v] of Object.entries(node))
      if (v && typeof v === "object" && k !== "model_urls" && k !== "modelUrls") scan(v, out, depth + 1);
  }
  function handle(text) {
    try {
      const out = [];
      scan(JSON.parse(text), out);
      if (out.length) window.postMessage({ __meshygrab: true, items: out }, "*");
    } catch {}
  }
  const of = window.fetch;
  window.fetch = function (...a) {
    const p = of.apply(this, a);
    p.then((r) => {
      if ((r.headers.get("content-type") || "").includes("json")) r.clone().text().then(handle).catch(() => {});
    }).catch(() => {});
    return p;
  };
  const os = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (...a) {
    this.addEventListener("load", () => {
      try {
        if ((this.responseType === "" || this.responseType === "text") &&
            (this.getResponseHeader("content-type") || "").includes("json")) handle(this.responseText);
      } catch {}
    });
    return os.apply(this, a);
  };
})();
