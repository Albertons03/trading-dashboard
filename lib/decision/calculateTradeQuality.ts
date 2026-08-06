import type {
  DecisionAction,
  TradeQuality,
} from "./types";

export function calculateTradeQuality(
  confidence: number,
  action: DecisionAction
): TradeQuality {
  if (
    confidence >= 80 &&
    (action === "LONG_READY" ||
      action === "SHORT_READY")
  ) {
    return "A";
  }

  if (confidence >= 60) {
    return "B";
  }

  return "C";
}