"use client";

import { useMemo, useState } from "react";
import { NewsListItem } from "./NewsListItem";

interface NewsItem {
  id: number;
  title: string;
  source: string;
  time: string;
  tag: string;
  summary: string;
}

interface NewsListStepProps {
  items: NewsItem[];
}

type FilterValue = "All" | "BTC" | "SOL" | "ETH" | "Sentiment";
type SortValue = "Newest" | "Oldest" | "A-Z";

export function NewsListStep({ items }: NewsListStepProps) {
  // 1. Ez az állapot tárolja, hogy jelenleg melyik szűrő van aktív.
  const [activeFilter, setActiveFilter] = useState<FilterValue>("All");

  // 2. Ez az állapot tárolja, hogy a lista milyen sorrendben jelenjen meg.
  const [sortOrder, setSortOrder] = useState<SortValue>("Newest");

  // 3. Először szűrjük a listát. Ha "All", akkor az összes elem marad.
  const filteredItems = useMemo(() => {
    if (activeFilter === "All") {
      return items;
    }

    return items.filter((item) => item.tag === activeFilter);
  }, [activeFilter, items]);

  // 4. Utána rendezzük a szűrt listát. A "Newest" esetben az id alapján csökkenő sorrendben jelenítjük meg.
  const sortedItems = useMemo(() => {
    const nextItems = [...filteredItems];

    if (sortOrder === "Newest") {
      return nextItems.sort((a, b) => b.id - a.id);
    }

    if (sortOrder === "Oldest") {
      return nextItems.sort((a, b) => a.id - b.id);
    }

    return nextItems.sort((a, b) => a.title.localeCompare(b.title));
  }, [filteredItems, sortOrder]);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-sm">
      {/* ez a lista egy új, önálló rész lesz: a dashboard legalsó információs blokkja */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">News feed</p>
          <h2 className="text-xl font-semibold text-white">Latest updates</h2>
        </div>

        {/* a badge most a rendezett lista elemszámát mutatja */}
        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-sm font-medium text-cyan-400">
          {sortedItems.length} items
        </span>
      </div>

      {/* 5. Ez a kis gombsor a szűréshez szolgál. */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {(["All", "BTC", "SOL", "ETH", "Sentiment"] as FilterValue[]).map((filter) => {
          const isActive = activeFilter === filter;

          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full px-3 py-1 text-sm transition ${
                isActive
                  ? "bg-cyan-500 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {filter}
            </button>
          );
        })}

        {/* 6. Ez a select adja a rendezési lehetőséget. */}
        <select
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value as SortValue)}
          className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm text-zinc-300"
        >
          <option value="Newest">Newest</option>
          <option value="Oldest">Oldest</option>
          <option value="A-Z">A-Z</option>
        </select>
      </div>

      {/* 7. Végül a lista a szűrt és rendezett elemekből épül fel. */}
      <ul className="mt-5 space-y-3">
        {sortedItems.map((item) => (
          <NewsListItem key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
