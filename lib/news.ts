const RSS_SOURCES = [
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", name: "CoinDesk" },
  { url: "https://cointelegraph.com/rss", name: "CoinTelegraph" },
  { url: "https://decrypt.co/feed", name: "Decrypt" },
];

// Kinyeri a <title> tageket az RSS XML-ből
// Két formátumot kezel: <![CDATA[...]]> és sima szöveg
function parseRssTitles(xml: string): string[] {
  const items = xml.split(/<item[\s>]/i).slice(1); // első elem a channel title, azt kihagyjuk

  return items
    .map((item) => {
      const cdata = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i);
      const plain = item.match(/<title>([\s\S]*?)<\/title>/i);
      const raw = cdata?.[1] ?? plain?.[1] ?? "";
      return raw
        .trim()
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    })
    .filter(Boolean)
    .slice(0, 8); // max 8 cím forrásonként
}

// 3 RSS forrásból párhuzamosan hír a nyers headline-okat
// Ha valamelyik forrás nem válaszol, a többit visszaadja
export async function fetchRawHeadlines(): Promise<string[]> {
  const results = await Promise.allSettled(
    RSS_SOURCES.map(async ({ url, name }) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; TradingBot/1.0)" },
      });
      clearTimeout(timeout);

      const xml = await res.text();
      return parseRssTitles(xml).map((title) => `${name}] ${title}`);
    })
  );

  const all: string[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      all.push(...result.value);
    } else {
      console.error("RSS fetch failed:", result.reason);
    }
  }

  return all;
}
