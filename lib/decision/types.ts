export type DecisionBias =
  | "LONG"
  | "SHORT"
  | "NEUTRAL";

export type DecisionAction =
  | "LONG_READY"
  | "SHORT_READY"
  | "WAIT_FOR_CONFIRMATION"
  | "NO_TRADE";

export type DecisionTimeframe =
  | "15M"
  | "1H"
  | "4H";

export type DecisionDirection =
  | "ABOVE"
  | "BELOW";

export type TradeQuality =
  | "A"
  | "B"
  | "C";

export type DecisionCondition = {
  timeframe: DecisionTimeframe;
  direction: DecisionDirection;
  price: number;
  condition: string;
};

export type MarketDecision = {
  bias: DecisionBias;
  confidence: number;
  tradeQuality: TradeQuality;
  action: DecisionAction;

  confirmation: DecisionCondition | null;
  invalidation: DecisionCondition | null;

  plannedEntry: number | null;
  stopLoss: number | null;
  target: number | null;

  recommendedAction: string;
  reasoning: string[];
};