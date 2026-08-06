import type {
  DecisionAction,
  DecisionBias,
  DecisionCondition,
  DecisionDirection,
  DecisionTimeframe,
  MarketDecision,
  TradeQuality,
} from "./types";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isNumber(value);
}

function isDecisionBias(value: unknown): value is DecisionBias {
  return ["LONG", "SHORT", "NEUTRAL"].includes(value as string);
}

function isDecisionAction(value: unknown): value is DecisionAction {
  return [
    "LONG_READY",
    "SHORT_READY",
    "WAIT_FOR_CONFIRMATION",
    "NO_TRADE",
  ].includes(value as string);
}

function isTradeQuality(value: unknown): value is TradeQuality {
  return ["A", "B", "C"].includes(value as string);
}

function isDecisionTimeframe(
  value: unknown
): value is DecisionTimeframe {
  return ["15M", "1H", "4H"].includes(value as string);
}

function isDecisionDirection(
  value: unknown
): value is DecisionDirection {
  return ["ABOVE", "BELOW"].includes(value as string);
}

function validateDecisionCondition(
  value: unknown
): value is DecisionCondition {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    isDecisionTimeframe(record.timeframe) &&
    isDecisionDirection(record.direction) &&
    isNumber(record.price) &&
    isString(record.condition)
  );
}

function isNullableDecisionCondition(
  value: unknown
): value is DecisionCondition | null {
  return value === null || validateDecisionCondition(value);
}

function validateMarketDecision(
  value: unknown
): value is MarketDecision {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    isDecisionBias(record.bias) &&
    isNumber(record.confidence) &&
    record.confidence >= 0 &&
    record.confidence <= 100 &&
    isTradeQuality(record.tradeQuality) &&
    isDecisionAction(record.action) &&
    isNullableDecisionCondition(record.confirmation) &&
    isNullableDecisionCondition(record.invalidation) &&
    isNullableNumber(record.plannedEntry) &&
    isNullableNumber(record.stopLoss) &&
    isNullableNumber(record.target) &&
    isString(record.recommendedAction) &&
    Array.isArray(record.reasoning) &&
    record.reasoning.every(isString)
  );
}

export function parseDecisionResponse(
  text: string
): MarketDecision | null {
  try {
    const parsed = JSON.parse(text);

    if (!validateMarketDecision(parsed)) {
      console.error(
        "[Decision Parser] Invalid decision structure:",
        parsed
      );
      return null;
    }

    return parsed;
  } catch (error) {
    console.error(
      "[Decision Parser] Failed to parse decision JSON:",
      error
    );
    return null;
  }
}