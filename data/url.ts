export type UrlState = {
  day?: string;
  answer?: string;
  answer2?: string;
  date?: string;
  emoji?: string;
  color?: string;
  qcolor?: string;
  bg?: string;
};

export const buildUrlParts = (state: UrlState) => {
  const parts: string[] = [];
  for (
    const k of [
      "day",
      "answer",
      "answer2",
      "date",
      "emoji",
      "color",
      "qcolor",
      "bg",
    ] as const
  ) {
    const v = state[k];
    if (v) parts.push(`${k}=${encodeURIComponent(v)}`);
  }
  return parts;
};

export const buildAnswerUrl = (state: UrlState) => {
  if (!state.day) return "/";
  const enc = (s: string) =>
    s.split(/\s+/).map(encodeURIComponent).join("_")
      .replace(/%27/g, "'").replace(/%2C/g, ",");
  const day = enc(state.day);
  const answer = (state.answer ?? "").trim();
  const emoji = (state.emoji ?? "").trim();
  const hasAnswer = answer.length > 0 && answer.toUpperCase() !== "YES";
  const slots: string[] = [];
  if (hasAnswer) slots.push(enc(answer.toUpperCase()));
  if (emoji) {
    if (!hasAnswer) slots.push("YES");
    slots.push(enc(emoji));
  }
  const qs: string[] = [];
  for (const k of ["color", "qcolor", "bg"] as const) {
    const v = state[k];
    if (v) {
      const bare = v.startsWith("#") ? v.slice(1) : v;
      qs.push(`${k}=${encodeURIComponent(bare)}`);
    }
  }
  if (state.date) qs.push(`date=${encodeURIComponent(state.date)}`);
  if (state.answer2) qs.push(`answer2=${encodeURIComponent(state.answer2)}`);
  return "/" + [day, ...slots].join("/") + (qs.length ? "?" + qs.join("&") : "");
};

export const parseAnswerUrl = (pathname: string, params: URLSearchParams): UrlState => {
  const segs = pathname.replace(/^\/+|\/+$/g, "").split("/");
  if (!segs[0]) return {};
  const dec = (s: string) => decodeURIComponent(s.replace(/_/g, "%20"));
  const state: UrlState = {};
  state.day = dec(segs[0]).trim();
  if (segs[1]) state.answer = dec(segs[1]).toUpperCase();
  if (segs[2]) state.emoji = dec(segs[2]);
  for (const k of ["color", "qcolor", "bg"] as const) {
    const v = params.get(k);
    if (v) state[k] = /^[0-9a-fA-F]{3,8}$/.test(v) ? "#" + v : v;
  }
  const date = params.get("date");
  if (date && /^\d{2}-\d{2}$/.test(date)) state.date = date;
  const answer2 = params.get("answer2");
  if (answer2) state.answer2 = answer2.toUpperCase();
  return state;
};
