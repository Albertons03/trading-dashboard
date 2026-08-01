interface RiskData {
  riskAmount: number;
  positionSize: number;
  stopDistance: number;
}

interface RiskManagementCardProps {
  risk: RiskData | null;
}

export function RiskManagementCard({ risk }: RiskManagementCardProps) {
  if (!risk) return null;

  return (
    <div className="p-4 mt-4 bg-gray-800 rounded-xl text-sm">
      <h3 className="mb-2">💰 Risk Management</h3>
      <p>Risk per trade: ${risk.riskAmount.toFixed(2)}</p>
      <p>Position size: {risk.positionSize.toFixed(4)} BTC</p>
      <p>Stop distance: ${risk.stopDistance}</p>
    </div>
  );
}
