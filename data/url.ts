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

export const stripHash = (s: string) => s.startsWith("#") ? s.slice(1) : s;

export const ensureHash = (s: string) => /^[0-9a-fA-F]{3,8}$/.test(s) ? "#" + s : s;

export const encodePathSeg = (s: string) =>
  s.split(/\s+/).map(encodeURIComponent).join("_")
    .replace(/%27/g, "'").replace(/%2C/g, ",");

export const decodeDaySeg = (s: string) => decodeURIComponent(s).replace(/[-_+]+/g, " ").trim();

export const decodeTextSeg = (s: string) => decodeURIComponent(s.replace(/_/g, "%20"));

export const buildAnswerUrl = (state: UrlState) => {
  if (!state.day) return "/";
  const day = state.day.split(/\s+/).map(encodeURIComponent).join("_")
    .replace(/%27/g, "'").replace(/%2C/g, ",");
  const answer = (state.answer ?? "").trim();
  const emoji = (state.emoji ?? "").trim();
  const hasAnswer = answer.length > 0 && answer.toUpperCase() !== "YES";
  const slots: string[] = [];
  if (hasAnswer) {
    slots.push(
      answer.toUpperCase().split(/\s+/).map(encodeURIComponent).join("_")
        .replace(/%27/g, "'").replace(/%2C/g, ","),
    );
  }
  if (emoji) {
    if (!hasAnswer) slots.push("YES");
    slots.push(
      emoji.split(/\s+/).map(encodeURIComponent).join("_")
        .replace(/%27/g, "'").replace(/%2C/g, ","),
    );
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
  const state: UrlState = {};
  state.day = decodeURIComponent(segs[0]).replace(/[-_+]+/g, " ").trim();
  if (segs[1]) state.answer = decodeURIComponent(segs[1].replace(/_/g, "%20")).toUpperCase();
  if (segs[2]) state.emoji = decodeURIComponent(segs[2].replace(/_/g, "%20"));
  if (!state.answer) {
    const q = params.get("answer");
    if (q) state.answer = q.toUpperCase();
  }
  if (!state.emoji) {
    const q = params.get("emoji");
    if (q) state.emoji = q;
  }
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
