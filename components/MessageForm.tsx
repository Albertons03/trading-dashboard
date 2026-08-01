"use client";

import { useState } from "react";

interface PostResponse {
  received: string;
  length: number;
  upper: string;
}

interface ErrorResponse {
   error: string;
}

export default function MessageForm() {
  const [input, setInput] = useState<string>("");
  const [response, setResponse] = useState<string>("");

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();

    const res = await fetch("/api/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input }),
    });

    if(!res.ok){
      const err: ErrorResponse = await res.json()
      setResponse(err.error);
      return;
    }

    const data: PostResponse = await res.json();
    setResponse(`Eredeti: ${data.received} Hossz: ${data.length} Upper: ${data.upper}`);
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Írj be valamit..."
          style={{ padding: "8px", marginRight: "8px" }}
        />
        <button type="submit">Küldés</button>
      </form>
      {response && <p>Szerver válasza: {response}</p>}
    </div>
  );
}



