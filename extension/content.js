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
function ensureOutfitFont() {
  try {
    const id = "huntier-font-outfit";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');`;
    (document.head || document.documentElement).appendChild(style);
  } catch {
  }
}
async function getSettings() {
  return new Promise((resolve) => {
    try {
      globalThis.chrome?.storage?.local?.get?.(["huntier_settings"], (r) => {
        resolve(r?.huntier_settings || {});
      });
    } catch {
      resolve({});
    }
  });
}
async function request(type, payload) {
  return new Promise((resolve) => {
    if (!globalThis?.chrome?.runtime?.sendMessage) {
      resolve({ ok: false, error: "no_runtime" });
      return;
    }
    const msg = { type, ...payload ?? {} };
    globalThis.chrome.runtime.sendMessage(msg, (resp) => {
      resolve(resp);
    });
  });
}
var helperDismissed = false;
function removeHelper() {
  const bar = document.getElementById("huntier-helper-bar");
  if (bar) try {
    bar.remove();
  } catch {
  }
  const fb = document.getElementById("huntier-feedback");
  if (fb) try {
    fb.remove();
  } catch {
  }
}
function injectButtons() {
  if (document.getElementById("huntier-helper-bar")) return;
  ensureOutfitFont();
  const container = document.body;
  const bar = document.createElement("div");
  bar.id = "huntier-helper-bar";
  bar.style.position = "fixed";
  bar.style.bottom = "16px";
  bar.style.right = "16px";
  bar.style.zIndex = "2147483647";
  bar.style.display = "flex";
  bar.style.gap = "8px";
  bar.style.background = "rgba(255,255,255,0.9)";
  bar.style.backdropFilter = "blur(6px)";
  bar.style.border = "1px solid rgba(0,0,0,0.08)";
  bar.style.borderRadius = "10px";
  bar.style.padding = "6px";
  bar.style.boxShadow = "0 6px 24px rgba(0,0,0,0.15)";
  bar.style.fontFamily = "Outfit, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial";
  const btnSave = document.createElement("button");
  btnSave.id = "huntier-btn-save";
  btnSave.textContent = "Save to Huntier";
  btnSave.style.padding = "6px 10px";
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
  const btnApply = document.createElement("button");
  btnApply.textContent = "Apply";
  btnApply.style.padding = "6px 10px";
  btnApply.style.borderRadius = "8px";
  btnApply.style.background = "white";
  btnApply.style.color = "#111827";
  btnApply.style.border = "1px solid rgba(0,0,0,0.15)";
  const btnClose = document.createElement("button");
  btnClose.textContent = "\xD7";
  btnClose.title = "Hide helper";
  btnClose.style.width = "24px";
  btnClose.style.height = "24px";
  btnClose.style.lineHeight = "22px";
  btnClose.style.textAlign = "center";
  btnClose.style.borderRadius = "999px";
  btnClose.style.border = "1px solid rgba(0,0,0,0.12)";
  btnClose.style.background = "white";
  btnClose.style.color = "#111827";
  const styleSpin = document.createElement("style");
  styleSpin.textContent = "@keyframes hnt-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}";
  (document.head || document.documentElement).appendChild(styleSpin);
  (async () => {
    try {
      btnSave.disabled = true;
      btnSave.innerHTML = '<span style="display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.6);border-top-color:white;border-radius:999px;margin-right:8px;vertical-align:-2px;animation: hnt-spin .9s linear infinite"></span>Processing\u2026';
      const resp = await request("huntier:precheck-application");
      if (resp?.ok) {
        if (resp.exists) {
          btnSave.disabled = false;
          btnSave.textContent = "Re-save \u2713";
        } else {
          btnSave.disabled = false;
          btnSave.textContent = saveDefaultLabel;
        }
      } else {
        btnSave.disabled = false;
        btnSave.textContent = saveDefaultLabel;
      }
    } catch {
      btnSave.disabled = false;
      btnSave.textContent = saveDefaultLabel;
    }
  })();
  async function computePlatformJobId() {
    try {
      const u = new URL(location.href);
      const canonical = document.querySelector('link[rel="canonical"]')?.href || u.href;
      const idParam = u.searchParams.get("gh_jid") || u.searchParams.get("lever-origin-jobId") || u.searchParams.get("jobId") || u.searchParams.get("jid");
      const key = `${u.hostname}:${idParam || (u.pathname || "/")}`;
      return key.toLowerCase();
    } catch {
      return null;
    }
  }
  btnSave.onclick = async () => {
    setSaving(true);
    const extracted = extractStructured();
    const platform_job_id = await computePlatformJobId();
    let resp = await request("huntier:save-application-ai", { stage: "wishlist", extracted, platform_job_id });
    if (!resp?.ok) {
      await request("huntier:get-token");
      resp = await request("huntier:save-application-ai", { stage: "wishlist", extracted, platform_job_id });
    }
    try {
      if (resp?.ok && resp?.data?.id) {
        const already = !!resp?.already_exists;
        setSaving(false, already ? "Saved \u2713" : "Saved \u2713");
        setTimeout(() => {
          btnSave.textContent = "Re-save";
        }, 900);
      } else {
        setSaving(false, "Retry Save");
      }
    } finally {
      if (!resp?.ok) setSaving(false);
    }
  };
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
  btnClose.onclick = () => {
    helperDismissed = true;
    removeHelper();
  };
  bar.appendChild(btnSave);
  bar.appendChild(btnApply);
  bar.appendChild(btnClose);
  container.appendChild(bar);
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
function listenToggleMessages() {
  try {
    globalThis.chrome?.runtime?.onMessage?.addListener?.((message, sender, _sendResponse) => {
      if (message?.type === "huntier:toggle-helper") {
        const enabled = !!message?.enabled;
        if (enabled && !helperDismissed) injectButtons();
        else removeHelper();
      }
    });
  } catch {
  }
}
async function boot() {
  listenHandshakeRelay();
  listenToggleMessages();
  ensureNetworkHook();
  const settings = await getSettings();
  const enabled = settings.helperEnabled !== false;
  if (enabled && !helperDismissed) injectButtons();
}
boot();
