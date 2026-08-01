 interface CalculationRiskParams {
  accountSize: number;
  riskPercent: number;
  entry: number;
  stopLoss: number;
}

export function calculateRisk({
  accountSize,
  riskPercent,
  entry,
  stopLoss,
}: CalculationRiskParams) {
  const riskAmount = accountSize * (riskPercent / 100);

  const stopDistance = Math.abs(entry - stopLoss);

  if (stopDistance === 0) {
    return null;
  }

  const positionSize = riskAmount / stopDistance;

  return {
    riskAmount,
    positionSize,
    stopDistance,
  };
}