import type { OverallSentimentLabel } from "./types";

export function getOverallSentimentLabel(
  score: number
): OverallSentimentLabel {
  if (score <= -70) return "STRONGLY_BEARISH";
  if (score <= -35) return "BEARISH";
  if (score <= -10) return "SLIGHTLY_BEARISH";
  if (score < 10) return "NEUTRAL";
  if (score < 35) return "SLIGHTLY_BULLISH";
  if (score < 70) return "BULLISH";

  return "STRONGLY_BULLISH";
}