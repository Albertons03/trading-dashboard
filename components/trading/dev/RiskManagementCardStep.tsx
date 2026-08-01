 interface RiskManagementCardStepProps {
  riskAmount: number;
  positionSize: number;
  stopDistance: number;
  riskPercent: number;
}

export function RiskManagementCardStep({
  riskAmount,
  positionSize,
  stopDistance,
  riskPercent,
}: RiskManagementCardStepProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-sm">
      {/* ez a fő doboz: rounded + border + bg + padding + shadow adja a „kártya” lookot */}
      <div className="flex items-center justify-between">
        {/* flex: a cím és a badge egymás mellé kerül */}
        <div>
          <p className="text-sm text-zinc-400">Risk Management</p>
          <h2 className="text-xl font-semibold text-white">Position sizing</h2>
        </div>

        {/* badge: itt egy külön kis elem jelenik meg a jobb oldalon */}
        <span className="rounded-full bg-amber-500/15 px-3 py-1 text-sm font-medium text-amber-400">
          {riskPercent}% risk
        </span>
      </div>

      {/* grid: a három érték külön kártyaként jelenik meg, md:grid-cols-3 miatt nagyobb képernyőn 3 oszlopban */}
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-zinc-800/70 p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Risk amount</p>
          <p className="mt-1 text-lg font-semibold text-white">${riskAmount.toFixed(2)}</p>
        </div>

        <div className="rounded-xl bg-zinc-800/70 p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Position size</p>
          <p className="mt-1 text-lg font-semibold text-white">{positionSize.toFixed(4)} BTC</p>
        </div>

        <div className="rounded-xl bg-zinc-800/70 p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Stop distance</p>
          <p className="mt-1 text-lg font-semibold text-white">${stopDistance}</p>
        </div>
      </div>

      {/* ez a szöveg azért van itt, hogy a blokk ne csak „kártya”, hanem értelmes is legyen */}
      <p className="mt-4 text-sm leading-6 text-zinc-400">
        This section shows how much capital is at risk and how large the position should be relative to the stop distance.
      </p>
    </section>
  );
}
