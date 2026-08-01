interface TradeSetupCardStepProps {
  bias: "LONG" | "SHORT" | "NEUTRAL";
  confidence: number;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  reason: string;
}

export function TradeSetupCardStep({
  bias,
  confidence,
  entry,
  stopLoss,
  takeProfit,
  reason,
}: TradeSetupCardStepProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-sm">
      {/* ez a fő doboz: rounded + border + bg + padding + shadow adja a kártya lookot */}
      <div className="flex items-center justify-between">
        {/* flex: a cím és a badge egymás mellé kerül */}
        <div>
          <p className="text-sm text-zinc-400">Trade Setup</p>
          <h2 className="text-xl font-semibold text-white">Directional view</h2>
        </div>

        {/* badge: a bias külön színnel jelenik meg, hogy gyorsan olvasható legyen */}
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            bias === "LONG"
              ? "bg-emerald-500/15 text-emerald-400"
              : bias === "SHORT"
                ? "bg-rose-500/15 text-rose-400"
                : "bg-zinc-700/70 text-zinc-300"
          }`}
        >
          {bias}
        </span>
      </div>

      {/* confidence sáv: itt egy egyszerű progress bar jelenik meg */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm text-zinc-400">
          <span>Confidence</span>
          <span>{confidence}/10</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-cyan-500"
            style={{ width: `${confidence * 10}%` }}
          />
        </div>
      </div>

      {/* grid: a három fontos érték külön kártyaként jelenik meg, md:grid-cols-3 miatt nagyobb képernyőn 3 oszlopban */}
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-zinc-800/70 p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Entry</p>
          <p className="mt-1 text-lg font-semibold text-white">{entry}</p>
        </div>
        <div className="rounded-xl bg-zinc-800/70 p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Stop Loss</p>
          <p className="mt-1 text-lg font-semibold text-white">{stopLoss}</p>
        </div>
        <div className="rounded-xl bg-zinc-800/70 p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Take Profit</p>
          <p className="mt-1 text-lg font-semibold text-white">{takeProfit}</p>
        </div>
      </div>

      {/* ez a szöveg adja a „magyarázatot” a blokkhoz */}
      <p className="mt-4 text-sm leading-6 text-zinc-400">{reason}</p>
    </section>
  );
}
