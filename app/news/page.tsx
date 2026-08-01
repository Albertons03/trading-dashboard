"use client";

import { useState } from "react";

export default function PracticeNewsPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ sentiment: string; headlines: string[] } | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    try {
      const res = await fetch("/api/news");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1>🧪 News Sentiment Practice Lab</h1>
      <p>Teszteld, hogyan dolgozza fel az AI a friss piaci híreket!</p>

      <button
        onClick={handleAnalyze}
        disabled={loading}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: loading ? "#ccc" : "#0070f3",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Hírek elemzése folyamatban..." : "Friss Hírek & Szentiment Elemzése"}
      </button>

      {data && (
        <div style={{ marginTop: "2rem" }}>
          <h2>🤖 AI Szentiment Elemzés</h2>
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#f0f4f8",
              borderRadius: "8px",
              borderLeft: "5px solid #0070f3",
              whiteSpace: "pre-wrap",
            }}
          >
            {data.sentiment}
          </div>

          <h3 style={{ marginTop: "2rem" }}>📰 Beolvasott Címsorok ({data.headlines?.length || 0})</h3>
          <ul style={{ backgroundColor: "#fafafa", padding: "1rem 2rem", borderRadius: "8px" }}>
            {data.headlines?.map((title, idx) => (
              <li key={idx} style={{ marginBottom: "0.5rem" }}>
                {title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}