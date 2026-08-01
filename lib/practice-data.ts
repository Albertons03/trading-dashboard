type ApiSource = {
  name: string;
  url: string;
  extractTitles: (data: any) => string[];
};

const API_SOURCES: ApiSource[] = [
 {
  name: "CoinPaprika",
  url: "https://api.coinpaprika.com/v1/news/latest?limit=8",
  extractTitles: (data) =>
    Array.isArray(data) ? data.map((item: any) => item.title) : [],
},
  {
    name: "Finnhub",
    url: `https://finnhub.io/api/v1/news?category=general&token=${process.env.FINNHUB_API_KEY}`,
    // Finnhub returns an array directly: [ { headline: "..." }, ... ]
    extractTitles: (data) =>
      Array.isArray(data) ? data.slice(0, 8).map((item: any) => item.headline) : [],
  },
  {
    name: "NewsData.io",
    // Fetches top 8 English crypto & market news
    url: `https://newsdata.io/api/1/latest?apikey=${process.env.NEWSDATA_API_KEY}&language=en&q=crypto%20OR%20stocks`,
    // NewsData returns data in: { results: [ { title: "..." }, ... ] }
    extractTitles: (data) =>
      data.results ? data.results.slice(0, 8).map((item: any) => item.title) : [],
  },
];

export async function fetchRawHeadlinesNews(): Promise<string[]> { 
  const results = await Promise.allSettled(
    API_SOURCES.map(async ({ url, name, extractTitles }) => {      
      // Abort requests taking longer than 5 seconds
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(url, { signal: controller.signal ,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; TradingBot/1.0)",
          "Accept": "application/json",
        },
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP error ${res.status} from ${name}`);

      const data = await res.json();
      const titles = extractTitles(data);

      return titles.map((title) => `[${name}] ${title}`);
    })
  );

  const all: string[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      all.push(...result.value);
    } else {
      console.error("API fetch failed:", result.reason);
    }
  }
  const uniqueHeadlines = Array.from(new Set(all));// leszuri az ismetleseket

  return uniqueHeadlines;
}