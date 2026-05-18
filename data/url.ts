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

export const URL_KEYS = [
  "day",
  "answer",
  "answer2",
  "date",
  "emoji",
  "color",
  "qcolor",
  "bg",
] as const;

export const buildUrlParts = (state: UrlState) => {
  const parts: string[] = [];
  for (const k of URL_KEYS) {
    const v = state[k];
    if (v) parts.push(`${k}=${encodeURIComponent(v)}`);
  }
  return parts;
};

export const stateFromParams = (params: URLSearchParams): UrlState => {
  const state: UrlState = {};
  for (const k of URL_KEYS) {
    const v = params.get(k);
    if (v) state[k] = v;
  }
  return state;
};
