
import { NextResponse } from "next/server";

// GET kérés – csak teszt

const messages: string[] = [];

export async function GET() {
  return NextResponse.json({messages });
}

// POST kérés – kliens küld adatot
export async function POST(req: Request) {
  const body = await req.json(); // JSON-t olvasunk a kérésből
  const { text } = body;         // kivesszük a "text" mezőt

  if(!text || text.trim() === ""){
    return NextResponse.json({error: "Nem lehet az uzenet ures"},
      {status: 400}
    );
  }
  
  messages.push(text);
  return NextResponse.json({ success: true, messages
   });
}