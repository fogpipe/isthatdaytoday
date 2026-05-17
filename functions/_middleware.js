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

export const onRequest = async (ctx) => {
  const response = await ctx.next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  const url = new URL(ctx.request.url);
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
    .on('meta[name="description"]', { element(el) { el.setAttribute("content", desc); } })
    .on('meta[property="og:title"]', { element(el) { el.setAttribute("content", title); } })
    .on('meta[property="og:description"]', { element(el) { el.setAttribute("content", desc); } })
    .on('meta[property="og:url"]', { element(el) { el.setAttribute("content", url.toString()); } })
    .on('meta[property="og:image"]', { element(el) { el.setAttribute("content", image); } })
    .on('meta[name="twitter:title"]', { element(el) { el.setAttribute("content", title); } })
    .on('meta[name="twitter:description"]', { element(el) { el.setAttribute("content", desc); } })
    .on('meta[name="twitter:image"]', { element(el) { el.setAttribute("content", image); } })
    .transform(response);
};
