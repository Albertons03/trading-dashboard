interface PriceCardProps {
  symbol: string;
  price: number | undefined;
}

export function PriceCard({ symbol, price }: PriceCardProps) {
  return (
    <div className="bg-gray-900 p-4 rounded-xl">
      <p className="text-gray-400 text-sm">{symbol}</p>
      <p className="text-2xl">${price?.toLocaleString() ?? "..."}</p>
    </div>
  );
}
