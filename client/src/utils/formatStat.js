// Rounds a real count down to a friendly, honest "X+" display value.
// e.g. 12 -> "10+", 25 -> "20+", 137 -> "100+", 1450 -> "1000+".
// We always round DOWN (never up) so the displayed number is never
// inflated beyond what's actually true.
export const formatStat = (n) => {
  const count = Number(n) || 0;
  if (count <= 0) return "0";
  if (count < 10) return `${count}+`;

  const digits = Math.floor(Math.log10(count)) + 1;
  const magnitude = Math.pow(10, digits - 1);
  const rounded = Math.floor(count / magnitude) * magnitude;

  return `${rounded}+`;
};