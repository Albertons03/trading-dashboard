"use client";

import { useState } from "react";

// A válasz JSON típusát definiáljuk
interface ApiResponse {
  message: string;
}

export default function ApiButton() {
  // message lehet üres string vagy a szerver válasza
  const [message, setMessage] = useState<string>("");

  async function handleClick(): Promise<void> {
    const res = await fetch("/api/hello");
    const data: ApiResponse = await res.json();
    setMessage(data.message);
  }

  return (
    <div>
      <button
        onClick={handleClick}
        style={{ padding: "8px 16px", background: "green", color: "white" }}
      >
        API hívás
      </button>
      {message && <p>Válasz: {message}</p>}
    </div>
  );
}
