import {NextRequest, NextResponse} from 'next/server';
import {createServerSupabaseClient} from '@/lib/supabase/client'; 
import openai from 'openai';

const openaiClient = new openai.OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try{
    const body = await request.json();

    if (typeof body.message !== 'string') {
      return NextResponse.json(
        {error: 'A message mező kötelező, és stringnek kell lennie.'},
        {status: 400}
      );
    }

    const message = body.message.trim();

    if (!message) {
      return NextResponse.json(
        {error: 'Az üzenet nem lehet üres.'},
        {status: 400}
      );
    }

    // 2. Supabase kliens és auth
    const supabase = await createServerSupabaseClient();

    const {
      data: {session},
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ [Chat API] Session error:', sessionError);
      return NextResponse.json(
        {error: 'Hiba történt a munkamenet lekérésekor.'},
        {status: 500}
      );
    }

    if(!session?.user){
      return NextResponse.json(
        {error: 'Be kell jelentkezni a chat használatához.'},
        {status: 401}
      );
    }
      
    //save the message to the database
    const {data: messageData, error: messageError} = await supabase
      .from('chat_messages')
      .insert({
        user_id: session.user.id,
        content: message,
        conversation_id: null,
        role: 'user',
      })
      .select()
      .single();

  } 
