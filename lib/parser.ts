import type{MarketDecision} from "./decision/types";

export type Decision = {
  bias: string;
  confidence: number;
  tradeQuality: string;
  action: string;
  plannedEntry: number;
  stopLoss: number;
  target: number;
  reasoning: string[];
};

export function parseDecision(text: string): MarketDecision | null {
  try {
    const json = JSON.parse(text);
    return {
  bias: json.bias ?? "NEUTRAL",

  confidence: Number(json.confidence) || 0,

  tradeQuality: json.tradeQuality ?? "C",

  action: json.action ?? "NO_TRADE",

  confirmation: json.confirmation ?? null,

  invalidation: json.invalidation ?? null,

  plannedEntry: Number(json.plannedEntry) ,

  stopLoss: Number(json.stopLoss) ,

  target: Number(json.target) ,

  recommendedAction:
    json.recommendedAction ?? "",

  reasoning: Array.isArray(json.reasoning)
    ? json.reasoning
    : [],
};
  } catch {
    // Ha valami miatt az AI nem adott vissza valid JSON-t
    console.error("Decision parse error – raw text:", text);
    return null;
  }
}
