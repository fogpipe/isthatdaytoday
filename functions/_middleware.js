import rawPresets from "../data/presets.ts";

const daySlug = (day) => day.split(/\s+/).map(encodeURIComponent).join("-");

const PRESETS = rawPresets.map((p) => ({
  day: p.day,
  slug: daySlug(p.day),
  emoji: p.emoji ?? "",
  answer: p.answer,
}));

const PRESET_DAYS = new Set(PRESETS.map((p) => p.day));

const parseDay = (pathname) => {
  const seg = decodeURIComponent(pathname).replace(/^\/+|\/+$/g, "");
  return seg.replace(/[-_+]+/g, " ").trim();
};

const ogImageUrl = (origin, day, params) => {
  const og = new URLSearchParams();
  og.set("day", day);
  for (const k of ["answer", "answer2", "date", "emoji", "color", "qcolor", "bg"]) {
    const v = params.get(k);
    if (v) og.set(k, v);
  }
  return `${origin}/og.png?${og.toString()}`;
};

const todayUTCMMDD = () => {
  const now = new Date();
  return `${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
};

const resolveAnswer = (params) => {
  const answer = (params.get("answer") ?? "YES").toUpperCase();
  const answer2 = (params.get("answer2") ?? "").toUpperCase();
  const date = params.get("date") ?? "";
  if (!/^\d{2}-\d{2}$/.test(date) || !answer2) return answer;
  return todayUTCMMDD() === date ? answer : answer2;
};

const setContent = (value) => ({
  element(el) { el.setAttribute("content", value); },
});

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const editHref = (day, params) => {
  const qs = new URLSearchParams(params);
  qs.set("day", day);
  return `/?${qs.toString()}`;
};

const otherDaysNav = (currentDay) => {
  const items = PRESETS
    .filter((p) => p.day !== currentDay)
    .slice(0, 8)
    .map((p) => {
      const label = `${p.emoji ? p.emoji + " " : ""}${escapeHtml(p.day)}`;
      return `<li><a href="/${p.slug}">${label}</a></li>`;
    })
    .join("");
  return `<nav class="other-days" aria-label="Other days"><span class="other-days-label">Other days</span><ul>${items}</ul></nav>`;
};

const jsonLdScript = (day, answer) => {
  const question = `Is it ${day} day today?`;
  const data = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: question,
      text: question,
      answerCount: 1,
      acceptedAnswer: { "@type": "Answer", text: answer },
    },
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
};

const RESERVED = new Set(["/privacy", "/privacy.html"]);

export const onRequest = async (ctx) => {
  const response = await ctx.next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  const url = new URL(ctx.request.url);
  if (RESERVED.has(url.pathname)) return response;
  const day = parseDay(url.pathname);
  if (!day) return response;

  const params = url.searchParams;
  const answer = resolveAnswer(params);
  const emoji = params.get("emoji") ?? "";

  const titleText = `${emoji ? emoji + " " : ""}Is it ${day} day today? ${answer}`;
  const question = `Is it ${day} day today?`;
  const desc = `Is it ${day} day today? ${answer}. Today's verdict on whether it's ${day} day.`;
  const image = ogImageUrl(url.origin, day, params);
  const canonical = `${url.origin}/${daySlug(day)}`;
  const isPreset = PRESET_DAYS.has(day);
  const editUrl = editHref(day, params);

  const headExtras = [
    jsonLdScript(day, answer),
    isPreset ? "" : '<meta name="robots" content="noindex">',
  ].join("");

  return new HTMLRewriter()
    .on("title", { element(el) { el.setInnerContent(titleText); } })
    .on('link[rel="canonical"]', { element(el) { el.setAttribute("href", canonical); } })
    .on('meta[name="description"]', setContent(desc))
    .on('meta[property="og:title"]', setContent(titleText))
    .on('meta[property="og:description"]', setContent(desc))
    .on('meta[property="og:url"]', setContent(url.toString()))
    .on('meta[property="og:image"]', setContent(image))
    .on('meta[name="twitter:title"]', setContent(titleText))
    .on('meta[name="twitter:description"]', setContent(desc))
    .on('meta[name="twitter:image"]', setContent(image))
    .on("head", { element(el) { el.append(headExtras, { html: true }); } })
    .on("body", { element(el) { el.setAttribute("class", "view-answer"); } })
    .on("div#e", {
      element(el) {
        if (!emoji) return;
        el.removeAttribute("hidden");
        el.setInnerContent(emoji);
      },
    })
    .on("a#ql", {
      element(el) {
        el.removeAttribute("hidden");
        el.setAttribute("href", editUrl);
      },
    })
    .on("h1#q", { element(el) { el.setInnerContent(question); } })
    .on("p#a", {
      element(el) {
        el.removeAttribute("hidden");
        el.setInnerContent(answer);
      },
    })
    .on("footer.site-footer", {
      element(el) { el.before(otherDaysNav(day), { html: true }); },
    })
    .transform(response);
};
