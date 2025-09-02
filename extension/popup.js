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
async function connect() {
  const url = `${APP_ORIGIN}/extension/connect?extId=${c.runtime.id}`;
  await c.tabs.create({ url, active: true });
}
function updateStatus(token) {
  const status = document.getElementById("status");
  const connectButton = document.getElementById("connect");
  if (token) {
    status.textContent = "\u2705 Connected to Huntier";
    status.style.background = "#ecfdf5";
    status.style.borderColor = "#10b981";
    status.style.color = "#065f46";
    connectButton.textContent = "Reconnect account";
    connectButton.style.background = "#6b7280";
  } else {
    status.textContent = "\u{1F517} Connect your Huntier account to get started";
    status.style.background = "#f9fafb";
    status.style.borderColor = "#e5e7eb";
    status.style.color = "#6b7280";
    connectButton.textContent = "Connect account";
    connectButton.style.background = "#111827";
  }
}
document.getElementById("connect")?.addEventListener("click", connect);
getToken().then(updateStatus);
