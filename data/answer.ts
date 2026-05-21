export type AnswerState = {
  answer?: string;
  answer2?: string;
  date?: string;
};

export const todayMMDD = (now: Date, utc: boolean) => {
  const month = utc ? now.getUTCMonth() : now.getMonth();
  const day = utc ? now.getUTCDate() : now.getDate();
  return `${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

export const resolveAnswer = (state: AnswerState, mmdd: string) => {
  const answer = (state.answer ?? "YES").toUpperCase();
  const answer2 = (state.answer2 ?? "").toUpperCase();
  const date = state.date ?? "";
  const valid = /^\d{2}-\d{2}$/.test(date) && answer2.length > 0;
  if (!valid) return answer;
  return mmdd === date ? answer : answer2;
};

export const isConditional = (state: AnswerState) => {
  const date = state.date ?? "";
  const answer2 = (state.answer2 ?? "").toUpperCase();
  return /^\d{2}-\d{2}$/.test(date) && answer2.length > 0;
};
