export type ConditionalInput = {
  answer: string;
  answer2: string;
  date: string;
};

export const todayMMDD = (now: Date, utc: boolean) => {
  const month = utc ? now.getUTCMonth() : now.getMonth();
  const day = utc ? now.getUTCDate() : now.getDate();
  return `${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

export const resolveAnswer = (input: ConditionalInput, mmdd: string) => {
  const valid = /^\d{2}-\d{2}$/.test(input.date) && input.answer2.length > 0;
  if (!valid) return input.answer;
  return mmdd === input.date ? input.answer : input.answer2;
};

export const readConditional = (params: URLSearchParams): ConditionalInput => ({
  answer: (params.get("answer") ?? "YES").toUpperCase(),
  answer2: (params.get("answer2") ?? "").toUpperCase(),
  date: params.get("date") ?? "",
});

export const isConditional = (input: ConditionalInput) =>
  /^\d{2}-\d{2}$/.test(input.date) && input.answer2.length > 0;
