import { HeadlineSentimentItem, NewsSentimentResponse } from "./types";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isOverallSentimentLabel(value: unknown): value is NewsSentimentResponse["overallSentiment"] {
  return [
    "STRONGLY_BEARISH",
    "BEARISH",
    "SLIGHTLY_BEARISH",
    "NEUTRAL",
    "SLIGHTLY_BULLISH",
    "BULLISH",
    "STRONGLY_BULLISH",
  ].includes(value as string);
}

function isCategory(value: unknown): value is HeadlineSentimentItem["category"] {
  return [
    "ETF",
    "REGULATION",
    "SECURITY",
    "INSTITUTIONAL",
    "MACRO",
    "MARKET",
    "OTHER",
  ].includes(value as string);
}

function isImpact(value: unknown): value is HeadlineSentimentItem["impact"] {
  return ["LOW", "MEDIUM", "HIGH"].includes(value as string);
}

function isTimeframe(value: unknown): value is HeadlineSentimentItem["timeframe"] {
  return ["INTRADAY", "SHORT_TERM", "MEDIUM_TERM"].includes(value as string);
}

function validateHeadlineItem(item: unknown): item is HeadlineSentimentItem {
  if (typeof item !== "object" || item === null) {
    return false;
  }

  const record = item as Record<string, unknown>;

  return (
    isString(record.headline) &&
    isCategory(record.category) &&
    isNumber(record.btcRelevance) &&
    record.btcRelevance >= 0 &&
    record.btcRelevance <= 10 &&
    isNumber(record.sentimentScore) &&
    record.sentimentScore >= -100 &&
    record.sentimentScore <= 100 &&
    isNumber(record.confidence) &&
    record.confidence >= 0 &&
    record.confidence <= 100 &&
    isImpact(record.impact) &&
    isTimeframe(record.timeframe) &&
    (isString(record.duplicateGroupId) || record.duplicateGroupId === null) &&
    isBoolean(record.isDuplicate) &&
    isString(record.reasoning)
  );
}

function validateResponse(value: unknown): value is NewsSentimentResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    isOverallSentimentLabel(record.overallSentiment) &&
    isNumber(record.overallWeightedScore) &&
    record.overallWeightedScore >= -100 &&
    record.overallWeightedScore <= 100 &&
    isNumber(record.confidence) &&
    record.confidence >= 0 &&
    record.confidence <= 100 &&
    isString(record.intradayBias) &&
    isString(record.shortTermBias) &&
    (isString(record.strongestBullishCatalyst) || record.strongestBullishCatalyst === null) &&
    (isString(record.strongestBearishRisk) || record.strongestBearishRisk === null) &&
    Array.isArray(record.items) &&
    record.items.every(validateHeadlineItem) &&
    isString(record.summary)
  );
}

export function parseSentimentResponse(
  text: string
): NewsSentimentResponse | null {
  try {
    const parsed = JSON.parse(text);
    if (!validateResponse(parsed)) {
      console.error("Invalid sentiment response structure", parsed);
      return null;
    }
    return parsed;
  } catch (err) {
    console.error("Failed to parse sentiment JSON", err);
    return null;
  }
}
