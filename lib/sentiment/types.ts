export type HeadlineSentimentItem = {
  headline: string;
  category:
    | "ETF"
    | "REGULATION"
    | "SECURITY"
    | "INSTITUTIONAL"
    | "MACRO"
    | "MARKET"
    | "OTHER";
  btcRelevance: number; // 0-10
  sentimentScore: number; // -100 to +100
  confidence: number; // 0-100
  impact: "LOW" | "MEDIUM" | "HIGH";
  timeframe: "INTRADAY" | "SHORT_TERM" | "MEDIUM_TERM";
  duplicateGroupId: string | null;
  isDuplicate: boolean;
  reasoning: string;
};

export type OverallSentimentLabel =
  | "STRONGLY_BEARISH"
  | "BEARISH"
  | "SLIGHTLY_BEARISH"
  | "NEUTRAL"
  | "SLIGHTLY_BULLISH"
  | "BULLISH"
  | "STRONGLY_BULLISH";

export type NewsSentimentResponse = {
  overallSentiment: OverallSentimentLabel;
  overallWeightedScore: number;
  confidence: number;
  intradayBias: string;
  shortTermBias: string;
  strongestBullishCatalyst: string | null;
  strongestBearishRisk: string | null;
  items: HeadlineSentimentItem[];
  summary: string;
};
