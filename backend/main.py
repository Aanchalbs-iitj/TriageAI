from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import heapq
import json
import os
from dotenv import load_dotenv
from groq import Groq 

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Connecting to the AI
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class TicketRequest(BaseModel):
    customer_email: str
    description: str
    category: str

ticket_queue = []
ticket_counter = 0


def get_ai_priority(description: str, category: str) -> int:
    system_prompt = """
    You are an expert customer support triage AI.
    Analyze the ticket and assign a priority score from 1 to 100.
    1 = lowest priority. 100 = highest emergency (loss of money, system down).
    You must return ONLY a raw JSON object with a single key "priority".
    DO NOT wrap the output in markdown blocks like ```json. 
    Do not add any conversational text.
    Example exactly like this: {"priority": 85}
    """
    
    user_prompt = f"Category: {category}\nDescription: {description}"
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="openai/gpt-oss-20b", 
            response_format={"type": "json_object"}, 
            temperature=0.0 
        )
        
        
        response_text = chat_completion.choices[0].message.content
        
        # Clean the text just in case the AI adds invisible spaces or markdown
        cleaned_text = response_text.strip().removeprefix("```json").removesuffix("```").strip()
        
        data = json.loads(cleaned_text)
        return int(data.get("priority", 30)) 
        
    except Exception as e:
        print("AI Error:", e)
        return 30

@app.get("/")
def home():
    return {"status": "Online", "project": "TriageAI Backend"}

@app.post("/tickets/")
def create_ticket(ticket: TicketRequest):
    global ticket_counter
    ticket_counter += 1
    
    
    real_priority_score = get_ai_priority(ticket.description, ticket.category)
    
    new_ticket = {
        "id": ticket_counter,
        "customer": ticket.customer_email,
        "original_text": ticket.description,
        "category_assigned": ticket.category,
        "status": "Open",
        "ai_priority": real_priority_score
    }
    
    # Push into max heap
    heapq.heappush(ticket_queue, (-real_priority_score, ticket_counter, new_ticket))
    return {"message": "Ticket Added to Queue", "ticket": new_ticket}

@app.get("/tickets/next/")
def get_next_ticket():
    if len(ticket_queue) == 0:
        return {"message": "Queue is empty!"}
        
    highest_priority_ticket = heapq.heappop(ticket_queue)
    return highest_priority_ticket[2]