"use client";
import { useTradeData } from "@/lib/hooks/useTradeData";
import { parseDecision } from "@/lib/parser";
import { calculateRisk } from "@/lib/risk";
import { PriceCard } from "@/components/trading/PriceCard";
import { TradeSetupCard } from "@/components/trading/TradeSetupCard";
import { AgentAnalysisGrid } from "@/components/trading/AgentAnalysisGrid";
import { NewsSection } from "@/components/trading/NewsSection";

export default function Home() {
  const { data } = useTradeData();

  const parsed = data?.decision ? parseDecision(data.decision) : null;

  const entry = parsed?.entry ?? 0;
  const sl = parsed?.sl ?? 0;

  const risk =
    entry && sl
      ? calculateRisk({
          accountSize: 700,
          riskPercent: 2,
          entry,
          stopLoss: sl,
        })
      : null;


  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl mb-6">📊 AI Trading Dashboard</h1>

      {/* PRICE + FEAR & GREED */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <PriceCard symbol="BTC" price={data?.btcPrice} />
        <PriceCard symbol="SOL" price={data?.solPrice} />
        <PriceCard symbol="Volt Greed" price={25} />

       
      </div>

      {/* TRADE SETUP */}
      <TradeSetupCard parsed={parsed} risk={risk} />

      {/* AGENTS GRID */}
      <AgentAnalysisGrid
        macro={data?.macro}
        technical={data?.technical}
        sentiment={data?.sentiment}
      />

      {/* NEWS */}
      <NewsSection headlines={data?.headlines} />
    </div>
  );
}