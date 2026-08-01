interface FearGreedCardProps {
  value: number | undefined;
  classification: string | undefined;
}

export function FearGreedCard({ value, classification }: FearGreedCardProps) {
  const getColorClass = (val: number | undefined) => {
    if (!val) return "text-gray-400";
    if (val <= 25) return "text-red-500";
    if (val <= 45) return "text-orange-400";
    if (val <= 55) return "text-yellow-400";
    if (val <= 75) return "text-green-400";
    return "text-green-300";
  };

  return (
    <div className="bg-gray-900 p-4 rounded-xl">
      <p className="text-gray-400 text-sm">Fear & Greed</p>
      <p className={`text-2xl font-bold ${getColorClass(value)}`}>
        {value ?? "..."}{" "}
        <span className="text-sm font-normal text-gray-400">
          {classification}
        </span>
      </p>
    </div>
  );
}
