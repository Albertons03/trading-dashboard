import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServerSupabaseClient } from "@/lib/supabase/client";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Te egy pimasz, vicces AI asszisztens vagy.
Röviden és pontosan válaszolj magyarul.
Ha a kérdés angolul jön, akkor is magyarul válaszolj, kivéve ha a user kifejezetten mást kér.`;

export async function POST(request: NextRequest) {
  try {
    // 1. Request body kiolvasása
    const body = await request.json();

    if (typeof body.message !== "string") {
      return NextResponse.json(
        {
          error: "A message mező kötelező, és stringnek kell lennie.",
        },
        { status: 400 }
      );
    }

    const message = body.message.trim();

    if (!message) {
      return NextResponse.json(
        {
          error: "Az üzenet nem lehet üres.",
        },
        { status: 400 }
      );
    }

    // 2. Supabase kliens és auth
    const supabase = await createServerSupabaseClient();

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("❌ [Chat API] Session error:", sessionError);

      return NextResponse.json(
        {
          error: "Nem sikerült ellenőrizni a bejelentkezést.",
        },
        { status: 500 }
      );
    }

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "Be kell jelentkezni a chat használatához.",
        },
        { status: 401 }
      );
    }

    // 3. Felhasználó üzenetének mentése
    const {
      data: savedUserMessage,
      error: userMessageError,
    } = await supabase
      .from("chat_messages")
      .insert({
        user_id: session.user.id,
        conversation_id: null,
        role: "user",
        content: message,
      })
      .select()
      .single();

    if (userMessageError) {
      console.error(
        "❌ [Chat API] User message save error:",
        userMessageError
      );

      return NextResponse.json(
        {
          error: "Nem sikerült menteni a felhasználói üzenetet.",
        },
        { status: 500 }
      );
    }

    // 4. OpenAI API hívás
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: message,
        },
      ],
      max_tokens: 500,
    });

    const assistantText =
      completion.choices[0]?.message?.content?.trim() ||
      "Sajnálom, nem tudtam válaszolni.";

    // 5. Assistant válaszának mentése
    const {
      data: savedAssistantMessage,
      error: assistantMessageError,
    } = await supabase
      .from("chat_messages")
      .insert({
        user_id: session.user.id,
        conversation_id: null,
        role: "assistant",
        content: assistantText,
      })
      .select()
      .single();

    if (assistantMessageError) {
      console.error(
        "❌ [Chat API] Assistant message save error:",
        assistantMessageError
      );

      return NextResponse.json(
        {
          error: "Az AI válaszolt, de a választ nem sikerült elmenteni.",
        },
        { status: 500 }
      );
    }

    // 6. Mindkét mentett üzenet visszaküldése
    return NextResponse.json({
      userMessage: savedUserMessage,
      assistantMessage: savedAssistantMessage,
    });
  } catch (error) {
    console.error("❌ [Chat API] POST error:", error);

    return NextResponse.json(
      {
        error: "Nem sikerült feldolgozni a kérést.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("❌ [Chat API] Session error:", sessionError);

      return NextResponse.json(
        {
          error: "Nem sikerült ellenőrizni a bejelentkezést.",
        },
        { status: 500 }
      );
    }

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "Be kell jelentkezni a chat használatához.",
        },
        { status: 401 }
      );
    }

    // Most már a user és assistant üzeneteket is lekérjük
    const { data: messages, error: messagesError } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error(
        "❌ [Chat API] Messages load error:",
        messagesError
      );

      return NextResponse.json(
        {
          error: "Nem sikerült betölteni az üzeneteket.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      messages: messages ?? [],
      count: messages?.length ?? 0,
    });
  } catch (error) {
    console.error("❌ [Chat API] GET error:", error);

    return NextResponse.json(
      {
        error: "Nem sikerült feldolgozni a kérést.",
      },
      { status: 500 }
    );
  }
}