type Base = {
  day: string;
  answer: string;
  emoji?: string;
  color?: string;
  qcolor?: string;
  bg?: string;
};

export type Preset =
  | (Base & { date?: never; answer2?: never })
  | (Base & { date: string; answer2: string });

const presets = [
  { day: "workout", answer: "YES" },
  { day: "pizza", answer: "YES", emoji: "🍕", color: "#dc2626", qcolor: "#3f2a14", bg: "#fdf6e3" },
  { day: "pajama", answer: "ALWAYS", emoji: "😴", color: "#a78bfa", qcolor: "#c7d2fe", bg: "#1e1b4b" },
  { day: "coffee", answer: "YES", emoji: "☕", color: "#8b4513", qcolor: "#3d2817", bg: "#f3e8d5" },
  { day: "slay", answer: "YES", color: "#ec4899", qcolor: "#f5f5f0", bg: "#0a0a0a" },
  { day: "your birth", answer: "YES", emoji: "🎂", color: "#ec4899", qcolor: "#581c87", bg: "#fef9c3" },
  { day: "doomscroll", answer: "ALAS", emoji: "📱", color: "#ef4444", qcolor: "#9ca3af", bg: "#111827" },
  { day: "good", answer: "YES", emoji: "😊", color: "#f59e0b", qcolor: "#78350f", bg: "#fef3c7" },
  { day: "leg", answer: "YES", emoji: "🦵", color: "#0891b2", qcolor: "#164e63", bg: "#ecfeff" },
  { day: "mercury retrograde", answer: "NO", color: "#991b1b", qcolor: "#2a1810", bg: "#f0e6d2" },
  { day: "taco", answer: "SÍ", emoji: "🌮", color: "#ea580c", qcolor: "#3f2a14", bg: "#fef3c7" },
  { day: "valentines", answer: "YES", answer2: "NO", date: "02-14", emoji: "💝", color: "#e11d48", qcolor: "#881337", bg: "#fff1f2" },
  { day: "kanelbullens", answer: "JA", answer2: "NEJ", date: "10-04", color: "#a16207", qcolor: "#451a03", bg: "#fef3c7" },
  { day: "syttende mai", answer: "JA", answer2: "NEI", date: "05-17", emoji: "🇳🇴", color: "#ba0c2f", qcolor: "#00205b", bg: "#f5f5f0" },
] satisfies Preset[];

export default presets;
