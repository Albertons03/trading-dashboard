interface NewsItem {
  id: number;
  title: string;
  source: string;
  time: string;
  tag: string;
  summary: string;
}

interface NewsListItemProps {
  item: NewsItem;
}

export function NewsListItem({ item }: NewsListItemProps) {
  return (
    <li className="rounded-xl border border-zinc-800 bg-zinc-800/50 p-4">
      {/* ez az egy elem külön komponensben van, hogy a lista tisztább legyen */}
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-zinc-700/70 px-2.5 py-1 text-xs uppercase tracking-wide text-zinc-300">
          {item.tag}
        </span>
        <span className="text-xs text-zinc-500">{item.time}</span>
      </div>

      <h3 className="mt-3 text-sm font-semibold text-white">{item.title}</h3>
      <p className="mt-1 text-sm text-zinc-400">{item.summary}</p>
      <p className="mt-2 text-xs text-zinc-500">{item.source}</p>
    </li>
  );
}
