// extension/bg/services.ts
var NetworkLogStore = class {
  logsByTab = /* @__PURE__ */ new Map();
  add(tabId, entry) {
    const arr = this.logsByTab.get(tabId) || [];
    arr.push({ ...entry, tabId });
    if (arr.length > 200) arr.splice(0, arr.length - 200);
    this.logsByTab.set(tabId, arr);
  }
  getRaw(tabId) {
    return tabId ? this.logsByTab.get(tabId) || [] : [];
  }
  estimateSize(obj) {
    try {
      return JSON.stringify(obj).length;
    } catch {
      return 0;
    }
  }
  prunePayload(payload) {
    try {
      if (typeof payload === "string") return payload.length > 1e4 ? payload.slice(0, 1e4) : payload;
      if (Array.isArray(payload)) return payload.slice(0, Math.min(payload.length, 5));
      if (payload && typeof payload === "object") {
        const out = {};
        for (const [k, v] of Object.entries(payload)) {
          if (Array.isArray(v)) out[k] = v.slice(0, Math.min(v.length, 5));
          else if (typeof v === "string") out[k] = v.length > 8e3 ? v.slice(0, 8e3) : v;
          else out[k] = v;
        }
        return out;
      }
    } catch {
    }
    return payload;
  }
  condense(entries) {
    if (!Array.isArray(entries) || entries.length === 0) return [];
    const denyHosts = ["mixpanel.com", "segment.com", "amplitude.com", "google-analytics.com", "analytics.google.com", "doubleclick.net", "hotjar.com", "intercom.io", "clarity.ms"];
    const keywords = ["job", "jobs", "position", "positions", "opening", "openings", "vacancy", "careers", "role", "graphql"];
    const results = [];
    let budget = 12e4;
    const urlHost = (u) => {
      try {
        return new URL(u).hostname;
      } catch {
        return "";
      }
    };
    const sorted = [...entries].sort((a, b) => {
      const ac = String(a?.response?.headers?.["content-type"] || a?.response?.headers?.["Content-Type"] || a?.response?.content_type || "").includes("json") ? 1 : 0;
      const bc = String(b?.response?.headers?.["content-type"] || b?.response?.headers?.["Content-Type"] || b?.response?.content_type || "").includes("json") ? 1 : 0;
      const ah = keywords.some((k) => String(a?.url || "").toLowerCase().includes(k)) ? 1 : 0;
      const bh = keywords.some((k) => String(b?.url || "").toLowerCase().includes(k)) ? 1 : 0;
      return bc + bh - (ac + ah);
    });
    for (const e of sorted) {
      const host = urlHost(String(e?.url || ""));
      if (!host || denyHosts.some((h) => host.endsWith(h))) continue;
      const status = Number(e?.status || 0);
      if (status < 200 || status >= 300) continue;
      const ct = String(e?.response?.headers?.["content-type"] || e?.response?.headers?.["Content-Type"] || e?.response?.content_type || "").toLowerCase();
      if (!ct.includes("json")) continue;
      const simplified = {
        url: String(e.url || ""),
        method: String(e.method || "GET"),
        status,
        response: { content_type: ct, body: this.prunePayload(e?.response?.body) }
      };
      let size = this.estimateSize(simplified);
      if (size > 25e3) {
        simplified.response.body = this.prunePayload(simplified.response.body);
        size = this.estimateSize(simplified);
      }
      if (budget - size <= 0) break;
      budget -= size;
      results.push(simplified);
      if (results.length >= 12) break;
    }
    if (results.length === 0) {
      for (const e of entries) {
        const ct = String(e?.response?.headers?.["content-type"] || e?.response?.headers?.["Content-Type"] || e?.response?.content_type || "").toLowerCase();
        if (!ct.includes("json")) continue;
        const simplified = { url: String(e.url || ""), method: String(e.method || "GET"), status: Number(e.status || 0), response: { content_type: ct, body: this.prunePayload(e?.response?.body) } };
        const size = this.estimateSize(simplified);
        if (size < 25e3) {
          results.push(simplified);
          break;
        }
      }
    }
    return results;
  }
  getCondensed(tabId) {
    return this.condense(this.getRaw(tabId));
  }
  pickLikelyJobEntries(entries) {
    try {
      const scored = entries.map((e) => {
        const url = String(e?.url || "").toLowerCase();
        const body = e?.response?.body;
        const ct = String(e?.response?.content_type || "").toLowerCase();
        let score = 0;
        if (ct.includes("json")) score += 2;
        if (/lever\.co\/api\/postings\//.test(url)) score += 10;
        if (/greenhouse\.io|gh\/boards|\/boards\//.test(url) && url.includes("jobs")) score += 8;
        if (/ashbyhq\.com|ashby/.test(url) && (url.includes("graphql") || url.includes("jobs"))) score += 6;
        if (/workday/.test(url) && /job|posting|jobPostings/i.test(url)) score += 6;
        if (/wellfound|angel|angellist/.test(url)) score += 4;
        if (/indeed|naukri|linkedin/.test(url)) score += 2;
        try {
          if (body && typeof body === "object") {
            const keys = Object.keys(body);
            const keyStr = keys.join(",").toLowerCase();
            if (keyStr.includes("job") || keyStr.includes("posting")) score += 3;
            if ("title" in body) score += 2;
            if ("company" in body || "employer" in body) score += 2;
            if ("location" in body) score += 1;
            if (Array.isArray(body.jobs) || Array.isArray(body.postings)) score += 2;
          }
        } catch {
        }
        return { e, score };
      });
      const sorted = scored.sort((a, b) => b.score - a.score);
      return sorted.slice(0, 2).filter((x) => x.score > 0).map((x) => x.e);
    } catch {
      return [];
    }
  }
};

// extension/background.ts
var c = globalThis.chrome;
var API_BASE = "https://api.huntier.pro/api";
var APP_ORIGIN = "https://huntier.pro";
var connectTabId = null;
var pendingResolvers = [];
async function runDeepCrawl(targetUrl) {
  try {
    const win = await c.windows.create({ url: targetUrl, focused: false, type: "popup", width: 900, height: 900, left: 5e3, top: 5e3 });
    const crawlWindowId = win?.id;
    const crawlTabId = win?.tabs?.[0]?.id;
    if (!crawlTabId) throw new Error("crawl_tab_missing");
    await new Promise((resolve) => {
      const listener = (tabId, info) => {
        if (tabId === crawlTabId && info?.status === "complete") {
          c.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      c.tabs.onUpdated.addListener(listener);
    });
    await c.scripting.executeScript({ target: { tabId: crawlTabId }, files: ["crawler.js"] });
    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        off();
        resolve(null);
      }, 2e4);
      const handler = (message, sender, _sendResponse) => {
        if (sender?.tab?.id === crawlTabId && message?.type === "huntier:crawl-result") {
          clearTimeout(timeout);
          off();
          resolve(message?.extracted || null);
        }
      };
      const off = () => c.runtime.onMessage.removeListener(handler);
      c.runtime.onMessage.addListener(handler);
    });
    if (crawlWindowId) {
      try {
        await c.windows.remove(crawlWindowId);
      } catch {
      }
    }
    return result;
  } catch (e) {
    console.warn("[Huntier:bg] runDeepCrawl failed", e);
    return null;
  }
}
console.log("[Huntier:bg] service worker loaded");
function notifyToken(token) {
  setAuth({ token, lastAt: Date.now() });
  console.log("[Huntier:bg] token received and stored");
  while (pendingResolvers.length) {
    try {
      pendingResolvers.shift()?.(token);
    } catch {
    }
  }
}
async function registerNetworkHook() {
  try {
    const exists = await c.scripting.getRegisteredContentScripts({ ids: ["huntier-network-hook"] }).catch(() => []);
    if (!exists || !exists.length) {
      await c.scripting.registerContentScripts([{
        id: "huntier-network-hook",
        matches: ["http://*/*", "https://*/*"],
        js: ["network-hook.js"],
        runAt: "document_start",
        world: "MAIN",
        allFrames: false,
        persistAcrossSessions: true
      }]);
      console.log("[Huntier:bg] registered network hook content script");
    }
  } catch (e) {
    console.warn("[Huntier:bg] failed to register network hook; will attempt lazy injection on tab updates", e);
    try {
      c.tabs.onUpdated.addListener((tabId, changeInfo) => {
        if (changeInfo?.status === "loading" || changeInfo?.status === "complete") {
          c.scripting.executeScript({ target: { tabId }, files: ["network-hook.js"], world: "MAIN" }).catch(() => {
          });
        }
      });
    } catch {
    }
  }
}
registerNetworkHook();
var logs = new NetworkLogStore();
c.runtime.onMessage.addListener((message, sender, _sendResponse) => {
  if (message?.type === "huntier:network-log" && sender?.tab?.id) {
    logs.add(sender.tab.id, message.entry);
  }
});
var condenseNetworkEntries = (all) => logs.condense(all);
var selectLikelyJobEntries = (entries) => logs.pickLikelyJobEntries(entries);
async function getAuth() {
  const data = await c.storage.local.get(["huntier_auth"]);
  return data.huntier_auth || {};
}
async function setAuth(auth) {
  await c.storage.local.set({ huntier_auth: auth });
}
async function getSettings() {
  const data = await c.storage.local.get(["huntier_settings"]);
  return data.huntier_settings || {};
}
async function setSettings(patch) {
  const cur = await getSettings();
  const next = { ...cur, ...patch };
  await c.storage.local.set({ huntier_settings: next });
}
async function ensureToken(interactive = true) {
  const cur = await getAuth();
  if (cur.token) return cur.token;
  if (!interactive) throw new Error("No token");
  const url = `${APP_ORIGIN}/extension/connect?extId=${c.runtime.id}`;
  if (!connectTabId) {
    console.log("[Huntier:bg] opening connect tab", url);
    const tab = await c.tabs.create({ url, active: true });
    connectTabId = tab.id || null;
  } else {
    try {
      await c.tabs.update(connectTabId, { active: true, url });
    } catch (e) {
      console.warn("[Huntier:bg] failed to update connect tab", e);
    }
  }
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      connectTabId = null;
      console.warn("[Huntier:bg] token wait timed out");
      reject(new Error("Timed out obtaining token"));
    }, 6e4);
    pendingResolvers.push((t) => {
      clearTimeout(timeout);
      resolve(t);
    });
  });
}
c.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  console.log("[Huntier:bg] external message", message?.type);
  if (message?.type === "huntier-token") {
    notifyToken(message.token);
    sendResponse({ ok: true });
    return true;
  }
  return void 0;
});
c.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log("[Huntier:bg] message", message?.type);
  (async () => {
    try {
      if (message?.type === "huntier:toggle-helper") {
        const enabled = !!message?.enabled;
        await setSettings({ helperEnabled: enabled });
        const targetTabId = message?.tabId;
        if (targetTabId) {
          try {
            await c.tabs.sendMessage(targetTabId, { type: "huntier:toggle-helper", enabled });
          } catch {
          }
        } else {
          const tabs = await c.tabs.query({});
          for (const t of tabs) {
            if (t?.id) try {
              await c.tabs.sendMessage(t.id, { type: "huntier:toggle-helper", enabled });
            } catch {
            }
          }
        }
        sendResponse({ ok: true });
        return;
      }
      if (message?.type === "huntier-token") {
        notifyToken(message.token);
        sendResponse({ ok: true });
        return;
      }
      if (message?.type === "huntier:precheck-application") {
        const token = await ensureToken(true);
        const [active] = await c.tabs.query({ active: true, currentWindow: true });
        const activeTabId = active?.id;
        const networkEntriesRaw = activeTabId ? tabNetworkLogs.get(activeTabId) || [] : [];
        const networkEntries = condenseNetworkEntries(networkEntriesRaw);
        let platform_id = null;
        let platform_job_id = null;
        try {
          if (networkEntries.length > 0) {
            const netRes = await fetch(`${API_BASE}/v1/applications/ai/extract-from-network`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ entries: networkEntries })
            });
            const net = await netRes.json().catch(() => null);
            console.log("[Huntier:bg] net", net);
            if (netRes.ok) {
              const ai = net?.ai || {};
              const jobUrl = ai?.job_url || ai?.url || void 0;
              const platformUrl = ai?.platform_url || ai?.platform || void 0;
              let platformOrigin;
              if (platformUrl) {
                try {
                  const u = new URL(String(platformUrl));
                  platformOrigin = `${u.protocol}//${u.hostname}`;
                } catch {
                }
              } else if (jobUrl) {
                try {
                  const u = new URL(String(jobUrl));
                  platformOrigin = `${u.protocol}//${u.hostname}`;
                } catch {
                }
              }
              if (platformOrigin) {
                const platRes = await fetch(`${API_BASE}/v1/platforms`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ name: platformOrigin.replace(/^https?:\/\//, "").replace(/^www\./, ""), url: platformOrigin })
                });
                const platform = await platRes.json().catch(() => null);
                platform_id = platform?.id || null;
              }
              console.log("[Huntier:bg] platform_job_id", platform_job_id);
              if (!platform_job_id && jobUrl) {
                console.log("[Huntier:bg] jobUrl found", jobUrl);
                try {
                  const uu = new URL(String(jobUrl));
                  const idParam = uu.searchParams.get("gh_jid") || uu.searchParams.get("lever-origin-jobId") || uu.searchParams.get("jobId") || uu.searchParams.get("jid");
                  platform_job_id = `${uu.hostname}:${idParam || (uu.pathname || "/")}`.toLowerCase();
                } catch {
                }
              }
            }
          }
        } catch {
        }
        let exists = false;
        try {
          const params = new URLSearchParams();
          if (platform_id) params.set("platform_id", platform_id);
          if (platform_job_id) params.set("platform_job_id", platform_job_id);
          if ([...params.keys()].length) {
            const res = await fetch(`${API_BASE}/v1/applications?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
              const arr = await res.json().catch(() => []);
              exists = Array.isArray(arr) && arr.length > 0;
            }
          }
        } catch {
        }
        sendResponse({ ok: true, platform_id, platform_job_id, exists });
        return;
      }
      if (message?.type === "huntier:save-application-ai") {
        const token = await ensureToken(true);
        console.log("[Huntier:bg] AI save requested", { stage: message?.stage, extracted: !!message?.extracted });
        const [active] = await c.tabs.query({ active: true, currentWindow: true });
        const activeTabId = active?.id;
        const networkEntriesRaw = logs.getRaw(activeTabId);
        const condensed = condenseNetworkEntries(networkEntriesRaw);
        const likely = selectLikelyJobEntries(condensed);
        const networkEntries = likely.length ? likely : condensed;
        console.log("[Huntier:bg] collected network entries", { count: networkEntries.length });
        let deepExtracted = null;
        try {
          const url = active?.url;
          if (url) {
            console.log("[Huntier:bg] launching deep crawl", url);
            deepExtracted = await runDeepCrawl(url);
          }
        } catch (e) {
          console.warn("[Huntier:bg] deep crawl skipped", e);
        }
        const dataUrl = await new Promise((resolve, reject) => {
          try {
            c.tabs.captureVisibleTab({ format: "jpeg", quality: 60 }, (url) => {
              if (url) resolve(url);
              else reject(new Error("capture failed"));
            });
          } catch (e) {
            reject(e);
          }
        });
        const blob = await (await fetch(dataUrl)).blob();
        let draft_id = null;
        try {
          if (networkEntries.length > 0) {
            let mapping = null;
            try {
              const mapRes = await fetch(`${API_BASE}/v1/applications/ai/map-network`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ entries: condensed.slice(0, 12) })
              });
              mapping = await mapRes.json().catch(() => null);
            } catch {
            }
            let entriesForExtract = networkEntries;
            if (mapping?.best_entry_index !== void 0 && mapping?.best_entry_index !== null) {
              const i = Number(mapping.best_entry_index);
              if (!isNaN(i) && i >= 0 && i < condensed.length) {
                entriesForExtract = [condensed[i]];
              }
            }
            console.log("[Huntier:bg] calling network extractor", { count: entriesForExtract.length });
            const netRes = await fetch(`${API_BASE}/v1/applications/ai/extract-from-network`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ entries: entriesForExtract, screenshot_data_url: dataUrl })
            });
            const net = await netRes.json().catch(() => null);
            if (netRes.ok && net?.draft_id) {
              draft_id = net.draft_id;
              console.log("[Huntier:bg] network extractor draft", draft_id, { ai: net?.ai, used: entriesForExtract.length });
            } else {
              console.warn("[Huntier:bg] network extractor failed", netRes.status, net);
            }
          }
        } catch (e) {
          console.warn("[Huntier:bg] network extractor error", e);
        }
        let existingApp = null;
        try {
          const pj = message?.platform_job_id;
          if (pj) {
            const search = new URLSearchParams({ platform_job_id: pj }).toString();
            const res = await fetch(`${API_BASE}/v1/applications?${search}`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
              const arr = await res.json().catch(() => []);
              if (Array.isArray(arr) && arr.length > 0) existingApp = arr[0];
            }
          }
        } catch {
        }
        if (existingApp?.id) {
          sendResponse({ ok: true, data: existingApp, already_exists: true });
          return;
        }
        const form = new FormData();
        form.append("files", blob, "screenshot.jpg");
        console.log("[Huntier:bg] uploading screenshot to extractor", { size: blob.size, type: blob.type });
        const extractRes = await fetch(`${API_BASE}/v1/applications/ai/extract-from-images${draft_id ? `?draft_id=${encodeURIComponent(draft_id)}` : ""}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form
        });
        if (!extractRes.ok) {
          const text = await extractRes.text().catch(() => "");
          sendResponse({ ok: false, error: `extract_failed:${extractRes.status}:${text}` });
          return;
        }
        if (!draft_id) {
          const j = await extractRes.json();
          draft_id = j?.draft_id;
        } else {
          await extractRes.json().catch(() => null);
        }
        console.log("[Huntier:bg] extracted draft id", draft_id);
        try {
          const [tab] = await c.tabs.query({ active: true, currentWindow: true });
          const tabUrl = tab?.url;
          if (tabUrl) {
            const u = new URL(tabUrl);
            const origin = `${u.protocol}//${u.hostname}`;
            const host = u.hostname.replace(/^www\./, "");
            const prettyName = host.split(".").slice(0, -1).join(" ").replace(/[-_]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()) || host;
            const platRes = await fetch(`${API_BASE}/v1/platforms`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ name: prettyName, url: origin })
            });
            const platform = await platRes.json().catch(() => null);
            console.log("[Huntier:bg] upsert platform", { origin, id: platform?.id });
            const patchBody = { job_url: tabUrl };
            if (platform?.id) patchBody.platform_id = platform.id;
            const ex = { ...message?.extracted || {}, ...deepExtracted || {} };
            if (ex?.title && !ex?.company?.name) patchBody.role = String(ex.title).slice(0, 180);
            if (ex?.company?.name || ex?.company?.website) {
              patchBody.notes = [
                ...Array.isArray(ex?.notes) ? ex.notes : [],
                [ex?.company?.name, ex?.company?.website].filter(Boolean).join(" \u2022 ")
              ].filter(Boolean).slice(0, 10);
            }
            if (ex?.location) {
              patchBody.notes = [...patchBody.notes || [], [ex.location.city, ex.location.country, ex.location.type].filter(Boolean).join(" \u2022 ")].filter(Boolean).slice(0, 10);
            }
            await fetch(`${API_BASE}/v1/applications/drafts/${draft_id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify(patchBody)
            });
          }
        } catch (e) {
          console.warn("[Huntier:bg] draft enrich failed", e);
        }
        const commit = await fetch(`${API_BASE}/v1/applications/drafts/${draft_id}/commit`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        const app = await commit.json();
        console.log("[Huntier:bg] committed draft -> application", { id: app?.id, company_id: app?.company_id });
        try {
          const platform_job_id = message?.platform_job_id;
          if (platform_job_id) {
            await fetch(`${API_BASE}/v1/applications/${app.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ platform_job_id })
            });
          }
        } catch {
        }
        if (message?.stage) {
          try {
            await fetch(`${API_BASE}/v1/applications/${app.id}/transition`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ to_stage: message.stage })
            });
            console.log("[Huntier:bg] transitioned stage", message.stage);
          } catch {
          }
        }
        sendResponse({ ok: true, data: app });
        return;
      }
      if (message?.type === "huntier:get-token") {
        const token = await ensureToken(true);
        sendResponse({ token });
        return;
      }
      if (message?.type === "huntier:save-application") {
        const token = await ensureToken(true);
        console.log("[Huntier:bg] creating application (raw)", message.body);
        const res = await fetch(`${API_BASE}/v1/applications`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(message.body || {})
        });
        const data = await res.json();
        sendResponse({ ok: res.ok, data });
        return;
      }
      if (message?.type === "huntier:create-draft") {
        const token = await ensureToken(true);
        console.log("[Huntier:bg] creating draft");
        const res = await fetch(`${API_BASE}/v1/applications/drafts`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        sendResponse({ ok: res.ok, data });
        return;
      }
    } catch (e) {
      console.error("[Huntier:bg] error", e);
      sendResponse({ ok: false, error: e?.message || String(e) });
    }
  })();
  return true;
});
