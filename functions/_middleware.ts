/// <reference types="@cloudflare/workers-types" />

import rawPresets from "../data/presets.ts";
import { readConditional, resolveAnswer, todayMMDD } from "../data/answer.ts";

const daySlug = (day: string) => day.split(/\s+/).map(encodeURIComponent).join("-");

const PRESET_DAYS = new Set(rawPresets.map((p) => p.day));

const parseDay = (pathname: string) => {
  const seg = decodeURIComponent(pathname).replace(/^\/+|\/+$/g, "");
  return seg.replace(/[-_+]+/g, " ").trim();
};

const ogImageUrl = (origin: string, day: string, params: URLSearchParams) => {
  const og = new URLSearchParams();
  og.set("day", day);
  for (const k of ["answer", "answer2", "date", "emoji", "color", "qcolor", "bg"]) {
    const v = params.get(k);
    if (v) og.set(k, v);
  }
  return `${origin}/og.png?${og.toString()}`;
};

const setContent = (value: string) => ({
  element(el: Element) {
    el.setAttribute("content", value);
  },
});

const editHref = (day: string, params: URLSearchParams) => {
  const qs = new URLSearchParams(params);
  qs.set("day", day);
  return `/?${qs.toString()}`;
};

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

export const onRequest: PagesFunction = async (ctx) => {
  const response = await ctx.next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  const url = new URL(ctx.request.url);
  if (RESERVED.has(url.pathname)) return response;
  const day = parseDay(url.pathname);
  if (!day) return response;

  const params = url.searchParams;
  const answer = resolveAnswer(readConditional(params), todayMMDD(new Date(), true));
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
    .on("title", {
      element(el) {
        el.setInnerContent(titleText);
      },
    })
    .on('link[rel="canonical"]', {
      element(el) {
        el.setAttribute("href", canonical);
      },
    })
    .on('meta[name="description"]', setContent(desc))
    .on('meta[property="og:title"]', setContent(titleText))
    .on('meta[property="og:description"]', setContent(desc))
    .on('meta[property="og:url"]', setContent(url.toString()))
    .on('meta[property="og:image"]', setContent(image))
    .on('meta[name="twitter:title"]', setContent(titleText))
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
