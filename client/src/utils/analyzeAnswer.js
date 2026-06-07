export const analyzeAnswer = (transcript = "", duration = 60) => {
  if (!transcript || transcript.trim().length === 0)
    return { confidence: 0, clarity: 0, sentiment: 0, score: 0 };

  const text  = transcript.trim();
  const words = text.split(/\s+/).filter(Boolean);
  const wpm   = (words.length / Math.max(duration, 1)) * 60;

  let confidence = 0;
  if      (words.length >= 80) confidence = 90;
  else if (words.length >= 50) confidence = 75;
  else if (words.length >= 30) confidence = 55;
  else if (words.length >= 15) confidence = 35;
  else                         confidence = 15;

  let clarity = 50;
  if      (wpm >= 110 && wpm <= 150) clarity = 90;
  else if (wpm >= 90  && wpm <= 170) clarity = 72;
  else if (wpm >= 70  && wpm <= 190) clarity = 55;
  else                               clarity = 35;

  const positiveWords = ["experience","learned","built","developed","implemented",
    "solved","improved","optimized","designed","confident","understand","familiar",
    "worked","created","achieved","success","deployed","managed","led","collaborated"];
  const negativeWords = ["don't know","not sure","no idea","never used","haven't"];

  let sentiment = 50;
  const lower = text.toLowerCase();
  positiveWords.forEach((w) => { if (lower.includes(w)) sentiment = Math.min(100, sentiment + 5); });
  negativeWords.forEach((w) => { if (lower.includes(w)) sentiment = Math.max(0,   sentiment - 10); });

  const score = Math.round((confidence * 0.4) + (clarity * 0.35) + (sentiment * 0.25));
  return {
    confidence: Math.min(100, Math.round(confidence)),
    clarity:    Math.min(100, Math.round(clarity)),
    sentiment:  Math.min(100, Math.round(sentiment)),
    score:      Math.min(100, Math.round(score)),
  };
};