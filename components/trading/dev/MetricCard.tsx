interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  accent?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  accent = "from-blue-500 to-cyan-500",
}: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-sm">
      {/* ez a kis csík a kártya tetején: vizuális hangsúly a címhez */}
      <div className={`mb-3 h-1.5 w-16 rounded-full bg-gradient-to-r ${accent}`} />
      {/* a cím és az érték külön sorban jelenik meg, hogy könnyebb legyen olvasni */}
      <p className="text-sm text-zinc-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {/* subtitle csak akkor jelenik meg, ha van adat, így nem lesz felesleges üres sor */}
      {subtitle ? <p className="mt-1 text-sm text-zinc-500">{subtitle}</p> : null}
    </div>
  );
}
