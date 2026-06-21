from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
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

def get_db_connection():
    conn = sqlite3.connect("tickets.db")
    conn.row_factory = sqlite3.Row #sql returns data as a tuple so this line tells SQLite to format the data like a Python dictionary
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_email TEXT,
            description TEXT,
            category TEXT,
            status TEXT,
            ai_priority INTEGER
        )
    ''')
    conn.commit()
    conn.close()

# ticket_queue = []
# ticket_counter = 0

init_db()


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
#api endpoints start from here
@app.get("/")
def home():
    return {"status": "Online", "project": "TriageAI Backend"}

@app.post("/tickets/")
def create_ticket(ticket: TicketRequest):
    # global ticket_counter
    # ticket_counter += 1
    ai_score = get_ai_priority(ticket.description, ticket.category)
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO tickets (customer_email, description, category, status, ai_priority)
        VALUES (?, ?, ?, ?, ?) 
    ''', (ticket.customer_email, ticket.description, ticket.category, "Open", ai_score))# prevents SQL Injection by writing ?
    conn.commit()
    conn.close()
    
    return {"message": "Ticket securely saved to database."}

@app.get("/tickets/next/")
def get_next_ticket():
    conn = get_db_connection()
    ticket = conn.execute('''
        SELECT * FROM tickets 
        WHERE status = 'Open' 
        ORDER BY ai_priority DESC, id ASC 
        LIMIT 1
    ''').fetchone()# limit 1 -Only hand me the single top row.
    
    if ticket is None:
        conn.close()
        return {"message": "Queue is empty!"}
    
    conn.execute("UPDATE tickets SET status = 'In Progress' WHERE id = ?", (ticket["id"],))
    conn.commit()
    conn.close()
    
    return dict(ticket)
        
@app.delete("/tickets/{ticket_id}")
def resolve_ticket(ticket_id: int):
    conn = get_db_connection()
    conn.execute("DELETE FROM tickets WHERE id = ?", (ticket_id,))
    conn.commit()
    conn.close()
    return {"message": "Ticket resolved and removed."}