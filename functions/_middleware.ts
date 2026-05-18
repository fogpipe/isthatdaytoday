/// <reference types="@cloudflare/workers-types" />

import rawPresets from "../data/presets.ts";
import { mergeConditional, readConditional, resolveAnswer, todayMMDD } from "../data/answer.ts";
import { buildUrlParts, stateFromParams } from "../data/url.ts";

const daySlug = (day: string) => day.split(/\s+/).map(encodeURIComponent).join("-");

const PRESET_DAYS = new Set(rawPresets.map((p) => p.day));

const parseDay = (pathname: string) => {
  const seg = decodeURIComponent(pathname).replace(/^\/+|\/+$/g, "");
  return seg.replace(/[-_+]+/g, " ").trim();
};

const dayUrl = (base: string, day: string, params: URLSearchParams) => {
  const state = stateFromParams(params);
  state.day = day;
  return `${base}?${buildUrlParts(state).join("&")}`;
};

const ogImageUrl = (origin: string, day: string, params: URLSearchParams) =>
  dayUrl(`${origin}/og.png`, day, params);

const editHref = (day: string, params: URLSearchParams) => dayUrl("/", day, params);

const setContent = (value: string) => ({
  element(el: Element) {
    el.setAttribute("content", value);
  },
});

const jsonLdScript = (day: string, answer: string) => {
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

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type ActivePreset = typeof rawPresets[number] & { date: string; answer2: string };

const findActivePreset = (mmdd: string): ActivePreset | undefined =>
  rawPresets.find((p): p is ActivePreset => p.date === mmdd);

const activePresetUrl = (p: ActivePreset) => {
  const qs = new URLSearchParams();
  qs.set("answer", p.answer);
  qs.set("answer2", p.answer2);
  qs.set("date", p.date);
  if (p.emoji) qs.set("emoji", p.emoji);
  if (p.color) qs.set("color", p.color);
  if (p.qcolor) qs.set("qcolor", p.qcolor);
  if (p.bg) qs.set("bg", p.bg);
  return `/${daySlug(p.day)}?${qs.toString()}`;
};

const activePresetStyle = (p: ActivePreset) => {
  const parts: string[] = [];
  if (p.bg) parts.push(`background:${p.bg}`);
  if (p.qcolor) parts.push(`color:${p.qcolor}`);
  return parts.join(";");
};

const activePresetInner = (p: ActivePreset) => {
  const emoji = p.emoji ? `<span class="active-preset-emoji">${escapeHtml(p.emoji)}</span>` : "";
  const dayStyle = p.color ? ` style="color:${p.color}"` : "";
  const dayHtml = `<span class="active-preset-day"${dayStyle}>${escapeHtml(p.day)}</span>`;
  return `${emoji}<span class="active-preset-copy">It's ${dayHtml} day today</span><span class="active-preset-arrow">→</span>`;
};

const withCacheControl = (response: Response, value: string) => {
  const headers = new Headers(response.headers);
  headers.set("cache-control", value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const handleRoot = (response: Response) => {
  const mmdd = todayMMDD(new Date(), true);
  const active = findActivePreset(mmdd);
  if (!active) return withCacheControl(response, "public, max-age=3600");

  const href = activePresetUrl(active);
  const styleAttr = activePresetStyle(active);
  const innerHTML = activePresetInner(active);

  const transformed = new HTMLRewriter()
    .on("a#active-preset", {
      element(el) {
        el.removeAttribute("hidden");
        el.setAttribute("href", href);
        if (styleAttr) el.setAttribute("style", styleAttr);
        el.setInnerContent(innerHTML, { html: true });
      },
    })
    .transform(response);
  return withCacheControl(transformed, "public, max-age=3600");
};

export const onRequest: PagesFunction = async (ctx) => {
  const response = await ctx.next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  const url = new URL(ctx.request.url);
  if (RESERVED.has(url.pathname)) return response;
  const day = parseDay(url.pathname);
  if (!day) return handleRoot(response);

  const params = url.searchParams;
  const preset = rawPresets.find((p) => p.day === day);
  const cond = preset ? mergeConditional(params, preset) : readConditional(params);
  const answer = resolveAnswer(cond, todayMMDD(new Date(), true));
  const emoji = params.get("emoji") ?? preset?.emoji ?? "";

  const tabTitle = `Is it ${day} day today? ${answer}`;
  const socialTitle = `${emoji ? emoji + " " : ""}${tabTitle}`;
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
    .on("title", {
      element(el) {
        el.setInnerContent(tabTitle);
      },
    })
    .on('link[rel="canonical"]', {
      element(el) {
        el.setAttribute("href", canonical);
      },
    })
    .on('meta[name="description"]', setContent(desc))
    .on('meta[property="og:title"]', setContent(socialTitle))
    .on('meta[property="og:description"]', setContent(desc))
    .on('meta[property="og:url"]', setContent(url.toString()))
    .on('meta[property="og:image"]', setContent(image))
    .on('meta[name="twitter:title"]', setContent(socialTitle))
    .on('meta[name="twitter:description"]', setContent(desc))
    .on('meta[name="twitter:image"]', setContent(image))
    .on("head", {
      element(el) {
        el.append(headExtras, { html: true });
      },
    })
    .on("body", {
      element(el) {
        el.setAttribute("class", "view-answer");
      },
    })
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
    .on("h1#q", {
      element(el) {
        el.setInnerContent(question);
      },
    })
    .on("p#a", {
      element(el) {
        el.removeAttribute("hidden");
        el.setInnerContent(answer);
      },
    })
    .transform(response);
};
