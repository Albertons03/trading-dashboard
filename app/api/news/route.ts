import { NextResponse } from "next/server";
import { fetchRawHeadlinesNews } from "@/lib/practice-data";
import { buildSentimentPrompt } from "@/lib/prompts";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})


async function callAgent(prompt: string): Promise<string> {
   try{
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{role: 'user', content: prompt}]
  });
     return response.choices[0]?.message?.content ?? "No output"
    }catch(err){
  console.error("[Api agent error]", err)
  return 'Error';
}
}


export async function GET(){
  try{
     const headlines = await fetchRawHeadlinesNews();

     if(headlines.length === 0){
      return NextResponse.json({
        sentiment: "Nem erkeztek hirek a forrasbol",
        headlines: [],
      })
     }
     const prompt = buildSentimentPrompt(headlines);
     const sentimentNews = await callAgent(prompt);

      return NextResponse.json({
      sentiment: sentimentNews,
      headlines: headlines,
      });

    }catch(err){
      console.error("API sentimentNews error", err);
    return NextResponse.json(
      { err: "Sikertelen sentiment elemzes" },  
      { status: 500 }
    )
  }

}

