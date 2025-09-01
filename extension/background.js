// extension/background.ts
var c = globalThis.chrome;
var API_BASE = self.VITE_API_URL || "http://localhost:3001/api";
var APP_ORIGIN = self.VITE_APP_ORIGIN || "http://localhost:3000";
var connectTabId = null;
var pendingResolvers = [];
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
        const commit = await fetch(`${API_BASE}/v1/applications/drafts/${draft_id}/commit`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
        const app = await commit.json();
        if (message?.stage) {
          try {
            await fetch(`${API_BASE}/v1/applications/${app.id}/transition`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ to_stage: message.stage })
            });
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
        console.log("[Huntier:bg] creating application");
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
