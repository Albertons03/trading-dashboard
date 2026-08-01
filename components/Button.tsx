"use client";

import { useEffect, useState } from "react"

interface Todo {
    id: number; text: string; done: boolean
  }

  interface TodosResponse {
      todos: Todo[]
  }

  interface ErrorResponse {
    error: string
  }


export default function Button(){
const [input, setInput] = useState<string>("");
const [todos, setTodos ] = useState<Todo[]>([]);



  useEffect(()=> {
      async function loadMessage(){
        const res = await fetch("/api/hello");
        const data : TodosResponse = await res.json();
        setTodos(data.todos);
      }
      loadMessage();
  },[])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault();

    const res = await fetch("/api/hello", {
      method: "POST",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({text : input})
    });

    const data: Apiresponse = await res.json();
    setMessage(data.message);
  }
     return ( 
     <div>

        <form onSubmit={handleSubmit}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Irj valamit" />
          <button type="submit">Api hivas</button>
          
        </form>
        {message && <p> szerver valasz: {message}</p>}
     </div>
     );




  
     

}
