import { RiskManagementCard } from "./RiskManagementCard";

interface ParsedDecision {
  bias: string;
  confidence: number;
  quality: string;
  action: string;
  entry: number;
  sl: number;
  tp: number;
  reason: string;
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
            parsed.bias === "LONG"
              ? "text-green-400"
              : parsed.bias === "SHORT"
              ? "text-red-400"
              : "text-gray-400"
          }`}
        >
          {parsed.bias}
        </span>
      </div>

      {/* CONFIDENCE BAR */}
      <div className="mb-3">
        <p className="text-gray-400 text-sm mb-1">
          Confidence: {parsed.confidence}/10
        </p>
        <div className="w-full bg-gray-700 h-2 rounded">
          <div
            className="bg-blue-500 h-2 rounded"
            style={{ width: `${parsed.confidence * 10}%` }}
          />
        </div>
      </div>

      {/* QUALITY */}
      <p className="mb-2">
        Trade Quality:{" "}
        <span className="font-bold">{parsed.quality}</span>
      </p>

      {/* ACTION */}
      <p className="mb-2">
        Action:{" "}
        <span className="font-bold">{parsed.action}</span>
      </p>

      {/* ENTRY / SL / TP */}
      <div className="mt-4 text-sm space-y-1">
        <p>📍 Entry: {parsed.entry}</p>
        <p>🛑 SL: {parsed.sl}</p>
        <p>🎯 TP: {parsed.tp}</p>
      </div>

      {/* REASON */}
      <div className="mt-4 text-xs text-gray-400">
        {parsed.reason}
      </div>

      {/* RISK MANAGEMENT */}
      <RiskManagementCard risk={risk} />
    </div>
  );
}
