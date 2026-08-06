import { useEffect, useState } from "react";
import type {BiasResponse} from "@/lib/types/bias";



export function useTradeData() {
  const [data, setData] = useState<BiasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/bias");
        const data: BiasResponse = await res.json();

        console.log("[Page] decision from API:", data.decision);

        console.log("[Page] sentiment from API:", data.sentiment);

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
