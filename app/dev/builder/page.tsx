"use client";

import { MetricCard } from "@/components/trading/dev/MetricCard";
import { NewsListStep } from "@/components/trading/dev/NewsListStep";
import { RiskManagementCardStep } from "@/components/trading/dev/RiskManagementCardStep";
import { TradeSetupCardStep } from "@/components/trading/dev/TradeSetupCardStep";

const mockData = {
  btcPrice: 68420,
  solPrice: 182,
  fearGreed: {
    value: 68,
    classification: "Greed",
  },
  tradeSetup: {
    bias: "SHORT" as const,
    confidence: 4,
    entry: 68500,
    stopLoss: 66800,
    takeProfit: 71000,
    reason: "Momentum remains strong after a bullish breakout and volume confirmation.",
  },
  riskManagement: {
    riskAmount: 140,
    positionSize: 0.0021,
    stopDistance: 1700,
    riskPercent: 2,
  },
  newsItems: [
    {
      id: 1,
      title: "BTC breaks above key resistance after strong volume",
      source: "CoinDesk",
      time: "10 min ago",
      tag: "BTC",
      summary: "Momentum is improving as buyers defend higher levels.",
    },
    {
      id: 2,
      title: "SOL sees renewed interest from institutional desks",
      source: "The Block",
      time: "28 min ago",
      tag: "SOL",
      summary: "Flow data suggests growing conviction in the short term.",
    },
    {
      id: 3,
      title: "Fear & Greed stays elevated as retail participation rises",
      source: "Alternative.me",
      time: "45 min ago",
      tag: "Sentiment",
      summary: "The market remains optimistic despite elevated risk.",
    },
    {
      id: 4,
      title: "ETH breaks above key resistance after strong volume",
      source: "Coinmarketcap",
      time: "15 min ago",
      tag: "ETH",
      summary: "The ETH is optimistic despite elevated risk.",
    },
  ],
};

export default function DashboardBuilder() {
  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <h1 className="mb-6 text-3xl font-semibold">🔨 Dashboard Builder</h1>
      <p className="mb-6 text-gray-400">
        Második lépés: egy Trade Setup blokk, amit fokozatosan bővítünk.
      </p>

      {/* 1. Az első rész marad: a metrics blokk, hogy a layout össze legyen kötve. */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard title="BTC" value={`$${mockData.btcPrice.toLocaleString()}`} subtitle="Spot price" />
        <MetricCard title="SOL" value={`$${mockData.solPrice.toLocaleString()}`} subtitle="Spot price" accent="from-purple-500 to-pink-500" />
        <MetricCard
          title="Fear & Greed"
          value={`${mockData.fearGreed.value}`}
          subtitle={mockData.fearGreed.classification}
          accent="from-emerald-500 to-lime-500"
        />
      </div>

      {/* 2. Ez a második blokk jelenik meg: a trade setup rész. */}
      <TradeSetupCardStep
        bias={mockData.tradeSetup.bias}
        confidence={mockData.tradeSetup.confidence}
        entry={mockData.tradeSetup.entry}
        stopLoss={mockData.tradeSetup.stopLoss}
        takeProfit={mockData.tradeSetup.takeProfit}
        reason={mockData.tradeSetup.reason}
      />

      {/* 3. Harmadik lépésként a risk management blokk is megjelenik. */}
      <div className="mt-6">
        <RiskManagementCardStep
          riskAmount={mockData.riskManagement.riskAmount}
          positionSize={mockData.riskManagement.positionSize}
          stopDistance={mockData.riskManagement.stopDistance}
          riskPercent={mockData.riskManagement.riskPercent}
        />
      </div>

      {/* 4. Negyedik lépésként egy news lista következik. */}
      <div className="mt-6">
        <NewsListStep items={mockData.newsItems} />
      </div>
    </div>
  );
}
