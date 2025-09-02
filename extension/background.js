// extension/background.ts
var c = globalThis.chrome;
var API_BASE = self.VITE_API_URL || "http://localhost:3001/api";
var APP_ORIGIN = self.VITE_APP_ORIGIN || "http://localhost:3000";
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
async function getAuth() {
  const data = await c.storage.local.get(["huntier_auth"]);
  return data.huntier_auth || {};
}
async function setAuth(auth) {
  await c.storage.local.set({ huntier_auth: auth });
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
      if (message?.type === "huntier-token") {
        notifyToken(message.token);
        sendResponse({ ok: true });
        return;
      }
      if (message?.type === "huntier:save-application-ai") {
        const token = await ensureToken(true);
        console.log("[Huntier:bg] AI save requested", { stage: message?.stage, extracted: !!message?.extracted });
        let deepExtracted = null;
        try {
          const [active] = await c.tabs.query({ active: true, currentWindow: true });
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
            c.tabs.captureVisibleTab({ format: "png" }, (url) => {
              if (url) resolve(url);
              else reject(new Error("capture failed"));
            });
          } catch (e) {
            reject(e);
          }
        });
        const blob = await (await fetch(dataUrl)).blob();
        const form = new FormData();
        form.append("files", blob, "screenshot.png");
        console.log("[Huntier:bg] uploading screenshot to extractor", { size: blob.size, type: blob.type });
        const extractRes = await fetch(`${API_BASE}/v1/applications/ai/extract-from-images`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form
        });
        if (!extractRes.ok) {
          const text = await extractRes.text().catch(() => "");
          sendResponse({ ok: false, error: `extract_failed:${extractRes.status}:${text}` });
          return;
        }
        const { draft_id } = await extractRes.json();
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
