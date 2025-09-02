// extension/popup.ts
var c = globalThis.chrome;
var APP_ORIGIN = self.VITE_APP_ORIGIN || "http://localhost:3000";
async function getToken() {
  return new Promise((resolve) => {
    c.storage.local.get(["huntier_auth"], (r) => {
      resolve(r.huntier_auth && r.huntier_auth.token || null);
    });
  });
}
async function getSettings() {
  return new Promise((resolve) => {
    c.storage.local.get(["huntier_settings"], (r) => {
      resolve(r.huntier_settings || {});
    });
  });
}
async function setSettings(patch) {
  const cur = await getSettings();
  const next = { ...cur, ...patch };
  await c.storage.local.set({ huntier_settings: next });
}
async function connect() {
  const url = `${APP_ORIGIN}/extension/connect?extId=${c.runtime.id}`;
  await c.tabs.create({ url, active: true });
}
async function openDashboard() {
  await c.tabs.create({ url: `${APP_ORIGIN}/dashboard`, active: true });
}
function setStatus(text, tone = "muted") {
  const status = document.getElementById("status");
  if (!status) return;
  status.textContent = text;
  status.classList.remove("status-success", "status-warn");
  if (tone === "success") status.classList.add("status-success");
  else if (tone === "warn") status.classList.add("status-warn");
}
function updateStatus(token) {
  const connectButton = document.getElementById("connect");
  if (!connectButton) return;
  if (token) {
    setStatus("\u2705 Connected to Huntier", "success");
    connectButton.textContent = "Reconnect";
    connectButton.style.background = "var(--secondary)";
    connectButton.style.color = "var(--secondary-foreground)";
  } else {
    setStatus("\u{1F517} Connect your Huntier account to get started", "muted");
    connectButton.textContent = "Connect";
    connectButton.style.background = "var(--primary)";
    connectButton.style.color = "var(--primary-foreground)";
  }
}
async function saveNow() {
  try {
    setStatus("\u23F3 Saving via AI\u2026", "muted");
    const resp = await new Promise((resolve) => {
      c.runtime.sendMessage({ type: "huntier:save-application-ai", stage: "wishlist" }, (r) => resolve(r));
    });
    if (resp?.ok) {
      setStatus("\u2705 Saved to Huntier", "success");
    } else {
      setStatus("\u26A0\uFE0F Save failed. Try reconnecting.", "warn");
    }
  } catch {
    setStatus("\u26A0\uFE0F Save failed. Try again.", "warn");
  }
}
async function init() {
  const connectBtn = document.getElementById("connect");
  const saveBtn = document.getElementById("save-now");
  const dashBtn = document.getElementById("open-dashboard");
  const toggle = document.getElementById("helper-toggle");
  const label = document.getElementById("helper-label");
  connectBtn?.addEventListener("click", connect);
  saveBtn?.addEventListener("click", saveNow);
  dashBtn?.addEventListener("click", openDashboard);
  const [token, settings] = await Promise.all([getToken(), getSettings()]);
  updateStatus(token);
  const enabled = settings.helperEnabled !== false;
  if (toggle) toggle.checked = enabled;
  if (label) label.textContent = enabled ? "Page helper: On" : "Page helper: Off";
  toggle?.addEventListener("change", async () => {
    const on = !!toggle.checked;
    await setSettings({ helperEnabled: on });
    if (label) label.textContent = on ? "Page helper: On" : "Page helper: Off";
    try {
      const [active] = await c.tabs.query({ active: true, currentWindow: true });
      if (active?.id) {
        c.runtime.sendMessage({ type: "huntier:toggle-helper", enabled: on, tabId: active.id });
      }
    } catch {
    }
  });
}
init();
