const parseDay = (pathname) => {
  const seg = decodeURIComponent(pathname).replace(/^\/+|\/+$/g, "");
  return seg.replace(/[-_+]+/g, " ").trim();
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

  return new HTMLRewriter()
    .on("title", { element(el) { el.setInnerContent(title); } })
    .on('meta[name="description"]', { element(el) { el.setAttribute("content", desc); } })
    .on('meta[property="og:title"]', { element(el) { el.setAttribute("content", title); } })
    .on('meta[property="og:description"]', { element(el) { el.setAttribute("content", desc); } })
    .on('meta[property="og:url"]', { element(el) { el.setAttribute("content", url.toString()); } })
    .on('meta[name="twitter:title"]', { element(el) { el.setAttribute("content", title); } })
    .on('meta[name="twitter:description"]', { element(el) { el.setAttribute("content", desc); } })
    .transform(response);
};
