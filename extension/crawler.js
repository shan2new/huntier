"use strict";
(() => {
  // extension/crawler.ts
  async function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
  function extractStructured() {
    const data = { title: "", company: {}, location: {}, sections: [] };
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    for (const s of scripts) {
      try {
        const json = JSON.parse(s.textContent || "null");
        const nodes = Array.isArray(json) ? json : [json];
        for (const n of nodes) {
          if (!n) continue;
          const types = (Array.isArray(n["@type"]) ? n["@type"] : [n["@type"]]).map((x) => String(x).toLowerCase());
          if (types.includes("jobposting")) {
            data.title = data.title || n.title || "";
            const org = n.hiringOrganization || {};
            data.company.name = data.company.name || org.name || "";
            data.company.website = data.company.website || org.sameAs || org.url || "";
            data.company.logo = data.company.logo || org.logo || "";
            const jlt = (n.jobLocationType || "").toString().toLowerCase();
            if (jlt.includes("remote")) data.location.type = "remote";
            else if (jlt.includes("hybrid")) data.location.type = "hybrid";
            else if (jlt.includes("onsite") || jlt.includes("on-site")) data.location.type = "onsite";
            const jl = n.jobLocation || {};
            const addr = jl?.address || n.address || {};
            data.location.city = data.location.city || addr.addressLocality || "";
            data.location.country = data.location.country || addr.addressCountry || "";
          }
        }
      } catch {
      }
    }
    const blocks = Array.from(document.querySelectorAll("h1, h2, h3, p, li")).slice(0, 400);
    for (const b of blocks) {
      const t = (b.textContent || "").trim();
      if (t.length > 0) data.sections.push(t.slice(0, 400));
    }
    return data;
  }
  async function crawlAndExtract() {
    const totalScrolls = 8;
    const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
    let lastY = -1;
    for (let i = 0; i < totalScrolls; i++) {
      window.scrollBy({ top: step, left: 0, behavior: "auto" });
      await sleep(400);
      const y = window.scrollY;
      if (y === lastY) break;
      lastY = y;
    }
    const extracted = extractStructured();
    globalThis.chrome?.runtime?.sendMessage?.({ type: "huntier:crawl-result", extracted });
  }
  crawlAndExtract().catch(() => {
    ;
    globalThis.chrome?.runtime?.sendMessage?.({ type: "huntier:crawl-result", extracted: null });
  });
})();
