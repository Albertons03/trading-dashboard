import { useEffect, useState } from "react";

export type TradeData = {
  btcPrice: number;
  solPrice: number;
  headlines: string[];
  fearGreed: { value: number; classification: string };
  macro: string;
  technical: string;
  sentiment: string;
  decision: string;
};

export function useTradeData() {
  const [data, setData] = useState<TradeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/bias");
        const data: TradeData = await res.json();
        console.log("BIAS API teljes válasz:", data);
        setData(data);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { data, loading, error };
}
