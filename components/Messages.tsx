"use client"

import {useState, useEffect} from "react";

export default function Messages(){
   const [input, setInput] = useState<string>("");
   const [messages, setMessages] = useState<string[]>([]);

  interface MessagesRespons {
    messages: string[];
  }

  

   useEffect(()=>{
    async function loadMessages(){
        const res = await fetch("/api/messages");

        const data: MessagesRespons = await res.json();
        setMessages(data.messages);

    }
    loadMessages();
   },[]);

   async function handleSubmit(e: React.SubmitEvent){
       e.preventDefault();

       const res = await fetch("/api/messages",{
        method: "POST",
        headers: {'Content-Type' : 'application/json'},
        body: JSON.stringify({text: input})
       });

       const data: MessagesRespons = await res.json();
       setMessages(data.messages);
       setInput("");
   }
 return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Írj be egy üzenetet..."
        />
        <button type="submit">Küldés</button>
      </form>

      <h3>Üzenetek:</h3>
      <ul>
        {messages.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}

