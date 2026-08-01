interface NewsSectionProps {
  headlines: string[] | undefined;
}

export function NewsSection({ headlines }: NewsSectionProps) {
  return (
    <div className="bg-gray-900 p-4 rounded-xl">
      <h2 className="text-lg mb-2">🗞️ News</h2>
      <ul className="text-sm space-y-1">
        {headlines?.map((h, i) => (
          <li key={i}>• {h}</li>
        ))}
      </ul>
    </div>
  );
}
