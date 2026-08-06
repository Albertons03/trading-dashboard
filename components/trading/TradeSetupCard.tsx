import { RiskManagementCard } from "./RiskManagementCard";
import type {DecisionBias, DecisionAction,DecisionCondition, TradeQuality} from "@/lib/decision/types";

interface ParsedDecision {
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
}

interface RiskData {
  riskAmount: number;
  positionSize: number;
  stopDistance: number;
}

interface TradeSetupCardProps {
  parsed: ParsedDecision | null;
  risk: RiskData | null;
}

export function TradeSetupCard({ parsed, risk }: TradeSetupCardProps) {

  const confidence = parsed?.confidence ?? 0;

  const plannedEntry = parsed?.plannedEntry ?? 0;
  const stopLoss = parsed?.stopLoss ?? 0;
  const target = parsed?.target ?? 0;

  const actionColor =
  parsed?.action === "LONG_READY"
    ? "bg-green-600 text-white"
    : parsed?.action === "SHORT_READY"
    ? "bg-red-600 text-white"
    : parsed?.action === "WAIT_FOR_CONFIRMATION"
    ? "bg-yellow-600 text-black"
    : "bg-gray-600 text-white";

const confidenceColor =
  confidence >= 80
    ? "bg-green-500"
    : confidence >= 60
    ? "bg-yellow-500"
    : "bg-red-500";

    const confidencetextColor =
  confidence >= 80
    ? "text-green-500"
    : confidence >= 60
    ? "text-yellow-500"
    : "text-red-500";

  const tradeQuality = parsed?.tradeQuality ?? "C";

  const qualityColor =
  tradeQuality === "A"
    ? "bg-green-600"
    : tradeQuality === "B"
    ? "bg-yellow-600"
    : "bg-red-600";

  if (!parsed) {
    return (
      <div className="p-5 rounded-xl mb-6 border border-gray-700 bg-gray-900">
        <h2 className="text-xl mb-4">🎯 Trade Setup</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl mb-6 border border-gray-700 bg-gray-900">
      <h2 className="text-xl mb-4">🎯 Trade Setup</h2>

      {/* BIAS */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-gray-400">Bias:</span>
        <span
          className={`font-bold ${
            parsed?.bias === "LONG"
              ? "text-green-400"
              : parsed?.bias === "SHORT"
              ? "text-red-400"
              : "text-gray-400"
          }`}
        >
          {parsed.bias}
        </span>
      </div>

      {/* CONFIDENCE BAR */}
      <div className="mb-3">
        <p className={`text-sm mb-1 ${confidencetextColor}`}>
            Confidence: {parsed.confidence}%
              {confidence >= 80
    ? "(High)"
    : confidence >= 60
    ? "(Medium)"
    : "(Low)"}
        </p>
        <div className="w-full bg-gray-700 h-2 rounded">
          <div
            className={`h-2 rounded ${confidenceColor}`}
            style={{ width: `${parsed.confidence}%` }}
          />
        </div>
      </div>

      {/* QUALITY */}
      <div className="flex items-center gap-3 mb-3">
       <span className="text-gray-400">
          Trade Quality:
       </span>

       <span
         className={`px-3 py-1 rounded-full text-sm font-bold text-white ${qualityColor}`}
        >
        {tradeQuality}
       </span>
      </div>

      {/* ACTION */}
    <div className="flex items-center gap-3 mb-3">
  <span className="text-gray-400">Action:</span>

  <span
    className={`px-3 py-1 rounded-full text-sm font-bold ${actionColor}`}
  >
    {parsed.action}
  </span>
</div>
      {/* CONFIRMATION */}
      {parsed.confirmation && (
        <div className="mt-4 rounded-lg border border-gray-700 bg-gray-800 p-4">
        <h3 className="mb-2 font-semibold">
        ✅ Confirmation
        </h3>

      <p className="text-sm">
      <span className="text-gray-400">
        {parsed.confirmation.timeframe} close{" "}
      </span>

      <span className="font-bold">
        {parsed.confirmation.direction}
      </span>

      <span className="text-gray-400">
        {" "}
        ${parsed.confirmation.price.toLocaleString()}
      </span>
    </p>

    <p className="mt-2 text-xs text-gray-400">
      {parsed.confirmation.condition}
    </p>
  </div>
)}

{/* INVALIDATION */}
{parsed.invalidation && (
  <div className="mt-4 rounded-lg border border-gray-700 bg-gray-800 p-4">
    <h3 className="mb-2 font-semibold">
      ❌ Invalidation
    </h3>

    <p className="text-sm">
      <span className="text-gray-400">
        {parsed.invalidation.timeframe} close{" "}
      </span>

      <span className="font-bold">
        {parsed.invalidation.direction}
      </span>

      <span className="text-gray-400">
        {" "}
        ${parsed.invalidation.price.toLocaleString()}
      </span>
    </p>

    <p className="mt-2 text-sm text-gray-400">
      {parsed.invalidation.condition}
    </p>
  </div>
)}

    {/* TRADE LEVELS */}
<div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
  <div className="rounded-lg border border-blue-700 bg-blue-950 p-4">
    <p className="text-sm text-gray-400">📍 Entry</p>
    <p className="mt-1 text-lg font-bold">
      {plannedEntry > 0
        ? `$${plannedEntry.toLocaleString()}`
        : "-"}
    </p>
  </div>

  <div className="rounded-lg border border-red-700 bg-red-950 p-4">
    <p className="text-sm text-gray-400">🛑 Stop Loss</p>
    <p className="mt-1 text-lg font-bold">
      {stopLoss > 0
        ? `$${stopLoss.toLocaleString()}`
        : "-"}
    </p>
  </div>

  <div className="rounded-lg border border-green-700 bg-green-950 p-4">
    <p className="text-sm text-gray-400">🎯 Target</p>
    <p className="mt-1 text-lg font-bold">
      {target > 0
        ? `$${target.toLocaleString()}`
        : "-"}
    </p>
  </div>
</div>

      {/* RECOMMENDED ACTION */}
      <div className="mt-5 rounded-lg bg-blue-950 border border-blue-700 p-4">
        <h3>💡 Recommended Action </h3>
        <p className="text-lg font-bold">{parsed.recommendedAction}</p>
      </div>

      {/* REASONING */}
<div className="mt-5 rounded-lg border border-gray-700 bg-gray-800 p-4">
  <h3 className="mb-3 font-semibold">
    🧠 AI Reasoning
  </h3>

  {parsed.reasoning.length > 0 ? (
    <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-gray-300">
      {parsed.reasoning.map((reason, index) => (
        <li key={index}>{reason}</li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-gray-400">
      No reasoning available.
    </p>
     )}
    </div>

      {/* RISK MANAGEMENT */}
      <RiskManagementCard risk={risk} />
    </div>
  );
}
