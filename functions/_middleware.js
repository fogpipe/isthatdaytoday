const parseDay = (pathname) => {
  const seg = decodeURIComponent(pathname).replace(/^\/+|\/+$/g, "");
  return seg.replace(/[-_+]+/g, " ").trim();
};

const ogImageUrl = (origin, day, params) => {
  const og = new URLSearchParams();
  og.set("day", day);
  for (const k of ["answer", "emoji", "color", "qcolor", "bg"]) {
    const v = params.get(k);
    if (v) og.set(k, v);
  }
  return `${origin}/og.png?${og.toString()}`;
};

const setContent = (value) => ({
  element(el) { el.setAttribute("content", value); },
});

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
  const answer = (params.get("answer") ?? "YES").toUpperCase();
  const emoji = params.get("emoji") ?? "";

  const title = `${emoji ? emoji + " " : ""}Is it ${day} day today? ${answer}`;
  const desc = `Today's verdict: ${answer}.`;
  const image = ogImageUrl(url.origin, day, params);

  return new HTMLRewriter()
    .on("title", { element(el) { el.setInnerContent(title); } })
    .on('meta[name="description"]', setContent(desc))
    .on('meta[property="og:title"]', setContent(title))
    .on('meta[property="og:description"]', setContent(desc))
    .on('meta[property="og:url"]', setContent(url.toString()))
    .on('meta[property="og:image"]', setContent(image))
    .on('meta[name="twitter:title"]', setContent(title))
    .on('meta[name="twitter:description"]', setContent(desc))
    .on('meta[name="twitter:image"]', setContent(image))
    .transform(response);
};
