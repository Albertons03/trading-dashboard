# RSS News Scraper – `lib/news.ts`

## Mire való?

A scraper feladata, hogy több kriptós hírforrásból automatikusan begyűjtse a legfrissebb hír-címsorokat (headline-okat), amelyeket aztán a `/api/bias` route átad a **Sentiment Agentnek** elemzésre.

---

## Forrásai

```
RSS_SOURCES = [
  CoinDesk      → https://www.coindesk.com/arc/outboundfeeds/rss/
  CoinTelegraph → https://cointelegraph.com/rss
  Decrypt       → https://decrypt.co/feed
]
```

Mindhárom forrás **ingyenes, nyilvános RSS feed** — nem kell API kulcs hozzájuk.

---

## Működési folyamat

```
fetchRawHeadlines() hívás
│
├── Promise.allSettled() — mindhárom forrást EGYSZERRE tölti le
│   │
│   ├── fetch(CoinDesk URL)       ─┐
│   ├── fetch(CoinTelegraph URL)  ─┼─ max 5 másodperc / forrás (AbortController timeout)
│   └── fetch(Decrypt URL)        ─┘
│
│   Ha valamelyik forrás nem válaszol → csak azt hagyja ki, a többi megmarad
│
├── Minden forrás esetén: parseRssTitles(xml) hívás
│
└── Eredmények összefűzése → string[]
```

---

## XML feldolgozás – `parseRssTitles(xml)`

Az RSS feed nyers XML szöveg. A függvény ebből nyeri ki a cím-tageket.

### 1. lépés – `<item>` blokkok szétválasztása

```
xml.split(/<item[\s>]/i).slice(1)
```

Az RSS struktúra így néz ki:
```xml
<channel>
  <title>CoinDesk</title>    ← ezt kihagyjuk (slice(1))
  <item>
    <title>Bitcoin hits new high</title>
    ...
  </item>
  <item>
    <title>Ethereum upgrade...</title>
    ...
  </item>
</channel>
```

A `slice(1)` azért kell, mert az első elem a **channel title** (pl. "CoinDesk"), nem egy hír.

### 2. lépés – Cím kinyerése kétféle formátumból

Az RSS feedek kétféleképpen tárolhatják a cím szövegét:

**CDATA formátum** (speciális karakterek esetén):
```xml
<title><![CDATA[Bitcoin: The $100K question & answer]]></title>
```

**Sima szöveg formátum:**
```xml
<title>Bitcoin hits new high</title>
```

A regex mindkettőt kezeli — a CDATA-t előbb próbálja, ha nincs, sima szöveggel dolgozik.

### 3. lépés – HTML entitások dekódolása

| Entitás   | Karakter |
|-----------|----------|
| `&amp;`   | `&`      |
| `&lt;`    | `<`      |
| `&gt;`    | `>`      |
| `&quot;`  | `"`      |
| `&#39;`   | `'`      |

Ez azért kell, mert az XML-ben a különleges karaktereket kódolva tárolják.

### 4. lépés – Limit

```
.slice(0, 8)  // max 8 cím forrásonként
```

Forrásonként legfeljebb 8 headline kerül be, hogy ne áraszda el a Sentiment Agentet.

---

## Kimenet

```typescript
[
  "[CoinDesk] Bitcoin hits new high above $95,000",
  "[CoinDesk] Fed signals rate cut amid crypto rally",
  "[CoinTelegraph] Ethereum ETF inflows surge",
  "[Decrypt] Solana breaks $200 resistance",
  ...
]
```

A forrás neve szögletes zárójelben szerepel az elején (`[CoinDesk]`, `[CoinTelegraph]`, `[Decrypt]`), hogy a Sentiment Agent tudja, honnan származik az információ.

---

## Hibakezelés

```
Promise.allSettled()
├── fulfilled → headline-ok hozzáadva
└── rejected  → "RSS fetch failed: ..." log, forrás kihagyva
```

A `Promise.allSettled()` kulcsfontosságú: ellentétben a `Promise.all()`-lal, **nem áll le az egész folyamat**, ha egy forrás hibázik. Ha pl. a CoinDesk nem válaszol, a CoinTelegraph és Decrypt eredményei megmaradnak.

---

## Kapcsolat a bias route-tal

```
lib/news.ts → fetchRawHeadlines()
                    ↓
app/api/bias/route.ts → sentimentPrompt
                    ↓
OpenAI Sentiment Agent → bullish / bearish / mixed értékelés
```

A scraper kimenetének első 10 headline-ja kerül be a Sentiment Agent promptjába.
