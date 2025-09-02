"use strict";
(() => {
  // extension/network-hook.ts
  (() => {
    if (window.__huntierNetworkHookInstalled) return;
    window.__huntierNetworkHookInstalled = true;
    function safePost(entry) {
      try {
        window.postMessage({ source: "huntier", type: "huntier:network-log", entry }, "*");
      } catch {
      }
    }
    function shouldCapture(url, headers) {
      try {
        const u = new URL(url, location.href);
        const path = (u.pathname || "").toLowerCase();
        if (/\.(png|jpg|jpeg|gif|svg|webp|ico|css|woff2?|ttf|otf|mp4|m3u8|mp3)$/i.test(path)) return false;
        const host = u.hostname;
        if (!host) return false;
        const ct = (headers?.["content-type"] || headers?.["Content-Type"] || "").toString().toLowerCase();
        if (ct.includes("json")) return true;
        if (path.includes("api") || path.includes("graphql") || path.includes("jobs") || path.includes("positions")) return true;
        return false;
      } catch {
        return false;
      }
    }
    try {
      const origFetch = window.fetch;
      window.fetch = async (...args) => {
        let url = "";
        let method = "GET";
        let reqHeaders = {};
        let reqBodyPreview;
        try {
          if (typeof args[0] === "string") url = args[0];
          else if (args[0]?.url) url = String(args[0].url);
          if (args[1]?.method) method = String(args[1].method);
          const h = args[1]?.headers || args[0]?.headers;
          if (h && typeof h.forEach === "function") h.forEach((v, k) => {
            reqHeaders[k] = v;
          });
          else if (h && typeof h === "object") reqHeaders = { ...h };
          if (typeof args[1]?.body === "string" && (args[1]?.body).length < 5e3) {
            reqBodyPreview = args[1].body;
          }
        } catch {
        }
        const res = await origFetch.apply(window, args);
        try {
          const clone = res.clone();
          const resHeaders = {};
          clone.headers?.forEach?.((v, k) => {
            resHeaders[k] = v;
          });
          if (!shouldCapture(url, resHeaders)) return res;
          const isJson = (resHeaders["content-type"] || "").toLowerCase().includes("json");
          let payload = null;
          try {
            payload = isJson ? await clone.json() : await clone.text();
          } catch {
            try {
              payload = await clone.text();
            } catch {
            }
          }
          safePost({ kind: "fetch", ts: Date.now(), url, method, status: res.status, request: { headers: reqHeaders, body_preview: reqBodyPreview }, response: { headers: resHeaders, body: payload } });
        } catch {
        }
        return res;
      };
    } catch {
    }
    try {
      const origOpen = XMLHttpRequest.prototype.open;
      const origSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function(method, url) {
        ;
        this.__huntier = { method, url, ts: Date.now() };
        return origOpen.apply(this, arguments);
      };
      XMLHttpRequest.prototype.send = function(body) {
        const ctx = this.__huntier || {};
        const reqBodyPreview = typeof body === "string" && body.length < 5e3 ? body : void 0;
        this.addEventListener("loadend", function() {
          try {
            const url = ctx.url || this.responseURL;
            const method = ctx.method || "GET";
            const status = this.status;
            const ct = String(this.getResponseHeader("content-type") || "").toLowerCase();
            if (!shouldCapture(url, { "content-type": ct })) return;
            let payload = null;
            try {
              payload = ct.includes("json") ? JSON.parse(this.responseText || "null") : this.responseText;
            } catch {
              payload = this.responseText;
            }
            safePost({ kind: "xhr", ts: Date.now(), url, method, status, request: { body_preview: reqBodyPreview }, response: { headers: { "content-type": ct }, body: payload } });
          } catch {
          }
        });
        return origSend.apply(this, arguments);
      };
    } catch {
    }
  })();
})();
