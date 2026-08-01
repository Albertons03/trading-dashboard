"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

// =====================================================
// TÍPUSOK
// =====================================================

type MessageRole = "user" | "assistant";

/**
 * Az adatbázisban tárolt chat üzenet.
 *
 * A backend ugyanilyen objektumokat ad vissza
 * a GET és a POST válaszban is.
 */
type ChatMessage = {
  id: string;
  user_id: string;
  conversation_id: string | null;
  role: MessageRole;
  content: string;
  created_at: string;
};  


/**
 * GET /api/chat sikeres válasz.
 */
type ChatGetSuccessResponse = {
  messages: ChatMessage[];
  count: number;
};

/**
 * POST /api/chat sikeres válasz.
 */
type ChatPostSuccessResponse = {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
};

/**
 * Sikertelen API-válasz.
 */
type ApiErrorResponse = {
  error: string;
};

// =====================================================
// KOMPONENS
// =====================================================

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Erre a láthatatlan elemre scrollozunk,
   * amikor új üzenet kerül a listába.
   */
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // =====================================================
  // ÜZENETEK BETÖLTÉSE
  // =====================================================

  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/chat");

      const data = (await response.json()) as
        | ChatGetSuccessResponse
        | ApiErrorResponse;

      if (!response.ok) {
        const errorData = data as ApiErrorResponse;

        throw new Error(
          errorData.error || `Hiba történt: ${response.status}`
        );
      }

      const successData = data as ChatGetSuccessResponse;

      /**
       * Már nincs szükség merge-logikára.
       *
       * A user és az assistant üzenetek is az adatbázisban vannak,
       * és a role mező megmondja, melyik üzenetet ki küldte.
       */
      setMessages(successData.messages);
    } catch (error) {
      console.error("❌ [Chat Page] Messages load error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Nem sikerült betölteni az üzeneteket."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Az oldal első betöltésekor lekérjük az üzeneteket.
   */
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  /**
   * Új üzenet után automatikusan a lista aljára görgetünk.
   */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isSending]);

  // =====================================================
  // ÜZENET KÜLDÉSE
  // =====================================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const message = input.trim();

    if (!message || isSending) {
      return;
    }

    setError(null);
    setIsSending(true);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
        }),
      });

      const data = (await response.json()) as
        | ChatPostSuccessResponse
        | ApiErrorResponse;

      if (!response.ok) {
        const errorData = data as ApiErrorResponse;

        throw new Error(
          errorData.error || "Hiba történt az üzenet küldése közben."
        );
      }

      const successData = data as ChatPostSuccessResponse;

      /**
       * A backend mindkét már elmentett rekordot visszaküldi:
       *
       * - userMessage
       * - assistantMessage
       *
       * Ezeket közvetlenül hozzáadjuk a state-hez.
       */
      setMessages((previousMessages) => [
        ...previousMessages,
        successData.userMessage,
        successData.assistantMessage,
      ]);
    } catch (error) {
      console.error("❌ [Chat Page] Message send error:", error);

      /**
       * Hiba esetén visszatesszük az inputba az üzenetet,
       * hogy a felhasználónak ne kelljen újra begépelnie.
       */
      setInput(message);

      setError(
        error instanceof Error
          ? error.message
          : "Nem sikerült elküldeni az üzenetet."
      );
    } finally {
      setIsSending(false);
    }
  };

  // =====================================================
  // LOADING ÁLLAPOT
  // =====================================================

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <p className="text-lg font-semibold text-slate-600">
          Üzenetek betöltése...
        </p>
      </main>
    );
  }

  // =====================================================
  // TELJES BETÖLTÉSI HIBA
  // =====================================================

  if (error && messages.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="max-w-md text-center">
          <p className="mb-4 text-lg text-red-600">
            ❌ {error}
          </p>

          <button
            type="button"
            onClick={fetchMessages}
            className="rounded-2xl bg-sky-600 px-5 py-3 text-white transition hover:bg-sky-700"
          >
            Újrapróbálkozás
          </button>
        </div>
      </main>
    );
  }

  // =====================================================
  // CHAT UI
  // =====================================================

  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <section className="mx-auto flex max-w-2xl flex-col rounded-3xl bg-white p-6 shadow-lg">
        <h1 className="mb-4 text-3xl font-semibold text-slate-900">
          Chat with AI
        </h1>

        {/* Üzenetek listája */}
        <div className="flex max-h-[60vh] min-h-96 flex-col gap-3 overflow-y-auto pr-2">
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              Írj valamit a chathez.
            </div>
          ) : (
            messages.map((message) => {
              const isUser = message.role === "user";

              return (
                <article
                  key={message.id}
                  className={`max-w-[85%] rounded-2xl p-4 ${
                    isUser
                      ? "self-end bg-sky-100 text-slate-900"
                      : "self-start bg-slate-100 text-slate-800"
                  }`}
                >
                  <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                    {isUser ? "Te" : "AI"}
                  </p>

                  <p className="mt-2 whitespace-pre-wrap break-words">
                    {message.content}
                  </p>

                  <p className="mt-2 text-xs text-slate-400">
                    {new Date(message.created_at).toLocaleString(
                      "hu-HU"
                    )}
                  </p>
                </article>
              );
            })
          )}

          {/* AI válaszára várakozás */}
          {isSending && (
            <article className="max-w-[85%] self-start rounded-2xl bg-slate-100 p-4 text-slate-800">
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                AI
              </p>

              <p className="mt-2 animate-pulse">
                Válasz írása...
              </p>
            </article>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Hibaüzenet */}
        {error && (
          <p className="mt-4 rounded-xl bg-rose-100 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        {/* Üzenetküldő form */}
        <form
          onSubmit={handleSubmit}
          className="mt-6 flex gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Írd be az üzeneted..."
            disabled={isSending}
            autoComplete="off"
            className="flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />

          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="rounded-2xl bg-sky-600 px-5 py-3 text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSending ? "Küldés..." : "Küldés"}
          </button>
        </form>
      </section>
    </main>
  );
}