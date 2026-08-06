"use client";
import { useTradeData } from "@/lib/hooks/useTradeData";
//import { parseDecision } from "@/lib/parser";
import { calculateRisk } from "@/lib/risk";
import { PriceCard } from "@/components/trading/PriceCard";
import { TradeSetupCard } from "@/components/trading/TradeSetupCard";
import { AgentAnalysisGrid } from "@/components/trading/AgentAnalysisGrid";
import { NewsSection } from "@/components/trading/NewsSection";
import { MarketDecision } from "@/lib/decision/types";

// const mockLongReady: MarketDecision = {
//   bias: "LONG",
//   confidence: 86,
//   tradeQuality: "A",
//   action: "LONG_READY",
//   confirmation: {
//     timeframe: "15M",
//     direction: "ABOVE",
//     price: 65000,
//     condition: "BTC has closed above 65000 with strong volume.",
//   },
//   invalidation: {
//     timeframe: "4H",
//     direction: "BELOW",
//     price: 64200,
//     condition: "The bullish setup is invalid below 64200.",
//   },
//   plannedEntry: 65100,
//   stopLoss: 64200,
//   target: 66800,
//   recommendedAction:
//     "The bullish confirmation is complete. The long setup is ready.",
//   reasoning: [
//     "Resistance has been reclaimed.",
//     "Volume confirms the breakout.",
//     "The setup meets the required confirmation conditions.",
//   ],
// };

// const mockShortReady: MarketDecision = {
//   bias: "SHORT",
//   confidence: 84,
//   tradeQuality: "A",
//   action: "SHORT_READY",
//   confirmation: {
//     timeframe: "15M",
//     direction: "BELOW",
//     price: 63800,
//     condition: "BTC has closed below 63800 with strong selling volume.",
//   },
//   invalidation: {
//     timeframe: "4H",
//     direction: "ABOVE",
//     price: 64600,
//     condition: "The bearish setup is invalid above 64600.",
//   },
//   plannedEntry: 63750,
//   stopLoss: 64600,
//   target: 62000,
//   recommendedAction:
//     "The bearish confirmation is complete. The short setup is ready.",
//   reasoning: [
//     "Support has broken.",
//     "Selling volume confirms the breakdown.",
//     "The setup meets the required bearish confirmation conditions.",
//   ],
// };

export default function Home() {
  const { data } = useTradeData();

  

  const parsedDecision = data?.decision ?? null;

  const parsedSentiment = data?.sentiment ?? null;

  const entry = parsedDecision?.plannedEntry ?? 0;
  const sl = parsedDecision?.stopLoss ?? 0;


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
        <PriceCard symbol="Conf" price={parsedSentiment?.confidence} />

       
      </div>

      {/* TRADE SETUP */}
      <TradeSetupCard parsed={parsedDecision} risk={risk} />

      {/* AGENTS GRID */}
      <AgentAnalysisGrid
        macro={data?.macro}
        technical={data?.technical}
        sentiment={parsedSentiment}
      />

      {/* NEWS */}
      <NewsSection headlines={data?.headlines} />
    </div>
  );
}