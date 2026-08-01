"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendMessage() {
    if (!message.trim()) return;

    const userMessage = message.trim();

    setLoading(true);
    setError("");
    setMessage("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Valami hiba tortent");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.assistantMessage },
      ]);
    } catch (err: any) {
      setError(err.message || "Ismeretlen hiba");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 700, margin: "40px auto", padding: "0 16px" }}>
      <h1>Practice Chatbot UI</h1>
      <p>Ez mar egy egyszeru chat UI, ami uzeneteket listaz es egy sajat API route-ot hiv.</p>

      <div
        style={{
          marginTop: 24,
          marginBottom: 24,
          padding: 16,
          border: "1px solid #ccc",
          borderRadius: 8,
          minHeight: 220,
          display: "grid",
          gap: 12,
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#666", margin: 0 }}>
            Meg nincs uzenet. Irj valamit a chatbotnak.
          </p>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              justifySelf: msg.role === "user" ? "end" : "start",
              maxWidth: "80%",
              padding: 12,
              borderRadius: 10,
              background: msg.role === "user" ? "#dbeafe" : "#f3f4f6",
            }}
          >
            <strong>{msg.role === "user" ? "Te" : "Bot"}:</strong>
            <p style={{ margin: "6px 0 0 0" }}>{msg.content}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Irj be valamit..."
          style={{ padding: 12, fontSize: 16 }}
        />

        <button
          onClick={handleSendMessage}
          disabled={loading}
          style={{ padding: 12, fontSize: 16, cursor: "pointer" }}
        >
          {loading ? "Kuldes..." : "Uzenet kuldese"}
        </button>
      </div>

      {error && (
        <p style={{ marginTop: 16, color: "crimson" }}>
          Hiba: {error}
        </p>
      )}
    </main>
  );
}