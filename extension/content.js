// extension/content.ts
function ensureNetworkHook() {
  try {
    const id = "huntier-network-hook";
    if (document.getElementById(id)) return;
    const s = document.createElement("script");
    s.id = id;
    s.src = globalThis.chrome?.runtime?.getURL?.("network-hook.js");
    s.type = "text/javascript";
    s.async = false;
    (document.head || document.documentElement).appendChild(s);
  } catch {
  }
}
function extractStructured() {
  const data = { title: "", company: {}, location: {} };
  const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  for (const s of scripts) {
    try {
      const json = JSON.parse(s.textContent || "null");
      const nodes = Array.isArray(json) ? json : [json];
      for (const n of nodes) {
        if (!n) continue;
        const type = (Array.isArray(n["@type"]) ? n["@type"] : [n["@type"]]).map((x) => String(x).toLowerCase());
        if (type.includes("jobposting")) {
          data.title = data.title || (n.title || "");
          const org = n.hiringOrganization || {};
          data.company.name = data.company.name || org.name || "";
          data.company.website = data.company.website || org.sameAs || org.url || "";
          data.company.logo = data.company.logo || org.logo || "";
          const jl = n.jobLocation || n.jobLocationType || {};
          const addr = jl.address || n.address || {};
          data.location.city = data.location.city || addr.addressLocality || "";
          data.location.country = data.location.country || addr.addressCountry || "";
          const jlt = (n.jobLocationType || "").toString().toLowerCase();
          if (jlt.includes("remote")) data.location.type = "remote";
          else if (jlt.includes("hybrid")) data.location.type = "hybrid";
          else if (jlt.includes("onsite") || jlt.includes("on-site")) data.location.type = "onsite";
        }
      }
    } catch {
    }
  }
  data.title = data.title || (document.querySelector("h1")?.textContent || "").trim();
  const metaUrl = document.querySelector('link[rel="canonical"]');
  const ogSite = document.querySelector('meta[property="og:site_name"]');
  const ogUrl = document.querySelector('meta[property="og:url"]');
  data.company.website = data.company.website || (ogUrl?.content || metaUrl?.href || "");
  data.company.name = data.company.name || (ogSite?.content || "");
  return data;
}
async function request(type, payload) {
  return new Promise((resolve) => {
    if (!globalThis?.chrome?.runtime?.sendMessage) {
      console.warn("[Huntier:cs] chrome.runtime.sendMessage unavailable");
      resolve({ ok: false, error: "no_runtime" });
      return;
    }
    const msg = { type, ...payload ?? {} };
    globalThis.chrome.runtime.sendMessage(msg, (resp) => {
      if (!resp || resp.ok === false) {
        console.warn("[Huntier:cs] request failed", type, resp?.error);
      }
      resolve(resp);
    });
  });
}
function injectButtons() {
  if (document.getElementById("huntier-btn-save")) return;
  const container = document.body;
  const bar = document.createElement("div");
  bar.style.position = "fixed";
  bar.style.bottom = "16px";
  bar.style.right = "16px";
  bar.style.zIndex = "2147483647";
  bar.style.display = "flex";
  bar.style.gap = "8px";
  const btnSave = document.createElement("button");
  btnSave.id = "huntier-btn-save";
  btnSave.textContent = "Save to Huntier";
  btnSave.style.padding = "8px 12px";
  btnSave.style.borderRadius = "8px";
  btnSave.style.background = "#111827";
  btnSave.style.color = "white";
  btnSave.style.border = "1px solid rgba(255,255,255,0.2)";
  const saveDefaultLabel = "Save to Huntier";
  function setSaving(saving, label) {
    btnSave.disabled = saving;
    btnSave.style.opacity = saving ? "0.7" : "1";
    btnSave.style.cursor = saving ? "wait" : "pointer";
    btnSave.textContent = label || (saving ? "Saving\u2026" : saveDefaultLabel);
  }
  const feedback = document.createElement("div");
  feedback.style.position = "fixed";
  feedback.style.bottom = "64px";
  feedback.style.right = "16px";
  feedback.style.zIndex = "2147483647";
  feedback.style.padding = "8px 10px";
  feedback.style.borderRadius = "8px";
  feedback.style.background = "rgba(17,24,39,0.9)";
  feedback.style.color = "white";
  feedback.style.fontSize = "12px";
  feedback.style.display = "none";
  function showFeedback(text) {
    feedback.textContent = text;
    feedback.style.display = "block";
    setTimeout(() => {
      feedback.style.display = "none";
    }, 3e3);
  }
  btnSave.onclick = async () => {
    setSaving(true);
    showFeedback("Saving via AI\u2026");
    const extracted = extractStructured();
    console.log("[Huntier:cs] sending message huntier:save-application-ai", { stage: "wishlist", extracted });
    let resp = await request("huntier:save-application-ai", { stage: "wishlist", extracted });
    if (!resp?.ok) {
      await request("huntier:get-token");
      resp = await request("huntier:save-application-ai", { stage: "wishlist", extracted });
    }
    try {
      if (resp?.ok && resp?.data?.id) {
        showFeedback("Saved to Huntier");
        console.log("[Huntier:cs] saved application", resp.data);
        setSaving(false, "Saved");
        setTimeout(() => setSaving(false), 1500);
      } else {
        showFeedback("Save failed");
        console.log("[Huntier:cs] save failed", resp);
        setSaving(false, "Retry Save");
        setTimeout(() => setSaving(false), 2e3);
      }
    } finally {
      if (!resp?.ok) {
        setSaving(false);
      }
    }
  };
  const btnApply = document.createElement("button");
  btnApply.textContent = "Apply";
  btnApply.style.padding = "8px 12px";
  btnApply.style.borderRadius = "8px";
  btnApply.style.background = "white";
  btnApply.style.color = "#111827";
  btnApply.style.border = "1px solid rgba(0,0,0,0.15)";
  btnApply.onclick = () => {
    const sel = [
      'button[aria-label*="apply" i]',
      'button:matches(#apply, .apply, [data-qa="apply"]), button:has-text("Apply")',
      'a:has-text("Apply")',
      'button[title*="Apply" i]'
    ];
    for (const s of sel) {
      try {
        const el = document.querySelector(s);
        if (el) {
          el.click();
          break;
        }
      } catch {
      }
    }
  };
  bar.appendChild(btnSave);
  bar.appendChild(btnApply);
  container.appendChild(bar);
  container.appendChild(feedback);
}
function listenHandshakeRelay() {
  window.addEventListener("message", (ev) => {
    if (ev?.data?.source === "huntier-connect" && ev?.data?.token) {
      ;
      globalThis.chrome?.runtime?.sendMessage?.({ type: "huntier-token", token: ev.data.token });
    }
    if (ev?.data?.source === "huntier" && ev?.data?.type === "huntier:network-log") {
      ;
      globalThis.chrome?.runtime?.sendMessage?.({ type: "huntier:network-log", entry: ev.data.entry });
    }
  });
}
listenHandshakeRelay();
ensureNetworkHook();
injectButtons();
