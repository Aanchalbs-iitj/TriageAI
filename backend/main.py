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
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class TicketRequest(BaseModel):
    customer_email: str
    description: str
    category: str

class Feedback(BaseModel):
    customer_email: str
    rating: str
    comments: str

def get_db_connection():
    conn = sqlite3.connect("tickets.db")
    conn.row_factory = sqlite3.Row #sql returns data as a tuple so this line tells SQLite to format the data like a Python dictionary
    return conn

def init_db():
    conn = get_db_connection()
    # Added confidence 
    conn.execute('''
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_email TEXT,
            description TEXT,
            category TEXT,
            status TEXT,
            ai_priority INTEGER,
            confidence INTEGER,
            needs_review BOOLEAN
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS feedbacks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_email TEXT,
            rating TEXT,
            comments TEXT
        )
    ''')
    feedback_columns = [row["name"] for row in conn.execute("PRAGMA table_info(feedbacks)").fetchall()]
    if "customer_email" not in feedback_columns:
        conn.execute("ALTER TABLE feedbacks ADD COLUMN customer_email TEXT DEFAULT 'unknown@example.com'")
    conn.commit()
    conn.close()

# ticket_queue = []
# ticket_counter = 0

init_db()

def get_ai_analysis(description: str, category: str) -> dict:
    system_prompt = """
    You are an expert customer support triage AI.
    Analyze the ticket and assign two scores from 1 to 100.
    
    1. "priority": 1 = lowest priority, 100 = highest emergency.
    2. "confidence": How sure are you that this is a valid, actionable support ticket? 
       (100 = clear, valid support request. 1 = gibberish, spam, or completely unrelated to customer support).
    
    CRITICAL RULE: If the user description is gibberish, a joke, or makes no logical sense, your "confidence" score MUST be 10.
    
    You must return ONLY a raw JSON object with these two keys.
    DO NOT wrap the output in markdown blocks. 
    Example exactly like this: {"priority": 85, "confidence": 95}
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
        
        # default to 30 priority and 0 confidence if it breaks
        return {
            "priority": int(data.get("priority", 30)),
            "confidence": int(data.get("confidence", 0))
        }
        
    except Exception as e:
        print("AI Error:", e)
        return {"priority": 30, "confidence": 0}

#api endpoints start from here
@app.get("/")
def home():
    return {"status": "Online", "project": "TriageAI Backend"}

@app.post("/tickets/")
def create_ticket(ticket: TicketRequest):
    ai_data = get_ai_analysis(ticket.description, ticket.category)
    
    # human review if the confidence drops below 70
    if ai_data["confidence"] < 70:
        assigned_status = "Needs Review"
        needs_review_flag = True
    else:
        assigned_status = "Open"
        needs_review_flag = False

    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO tickets (customer_email, description, category, status, ai_priority, confidence, needs_review)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (ticket.customer_email, ticket.description, ticket.category, assigned_status, ai_data["priority"], ai_data["confidence"], needs_review_flag))
    
    conn.commit()
    conn.close()
    
    return {"message": "Ticket securely saved.", "status": assigned_status}
# limit 1 -Only hand me the single top row.
@app.get("/tickets/next/")
def get_next_ticket(category: str = "All"):
    conn = get_db_connection()
    
    # If a specific category is requested, filter by it. Otherwise, pull from all.
    if category != "All":
        ticket = conn.execute(
            "SELECT * FROM tickets WHERE status = 'Open' AND category = ? ORDER BY ai_priority DESC LIMIT 1",
            (category,)
        ).fetchone()
    else:
        ticket = conn.execute(
            "SELECT * FROM tickets WHERE status = 'Open' ORDER BY ai_priority DESC LIMIT 1"
        ).fetchone()

    if ticket is None:
        conn.close()
        return {"message": f"Queue is empty for {category}!"}

    # Mark the ticket as In Progress
    conn.execute("UPDATE tickets SET status = 'In Progress' WHERE id = ?", (ticket['id'],))
    conn.commit()
    
    updated_ticket = dict(ticket)
    updated_ticket['status'] = 'In Progress'
    conn.close()
    
    return updated_ticket

# Fetch review tickets by urgency first, then oldest within the same priority.
@app.get("/tickets/review/")
def get_review_tickets(limit: int = 5):
    conn = get_db_connection()
    tickets = conn.execute(
        "SELECT * FROM tickets WHERE status = 'Needs Review' ORDER BY ai_priority DESC, id ASC LIMIT ?",
        (limit,)
    ).fetchall()
    conn.close()
    return [dict(t) for t in tickets]

# approve a ticket and push it to the main queue
@app.put("/tickets/{ticket_id}/approve")
def approve_ticket(ticket_id: int):
    conn = get_db_connection()
    conn.execute("UPDATE tickets SET status = 'Open' WHERE id = ?", (ticket_id,))
    conn.commit()
    conn.close()
    return {"message": "Ticket approved and pushed to Open queue."}

# user feedback
@app.post("/feedback/")
def submit_feedback(feedback: Feedback):
    conn = get_db_connection()
    conn.execute(
        "INSERT INTO feedbacks (customer_email, rating, comments) VALUES (?, ?, ?)", 
        (feedback.customer_email, feedback.rating, feedback.comments)
    )
    conn.commit()
    conn.close()
    return {"message": "Feedback securely saved to database!"}

# Fetch only the most recent feedback for the Manager Dashboard to prevent UI overload.
@app.get("/feedback/")
def get_feedbacks(limit: int = 9):
    conn = get_db_connection()
    feedbacks = conn.execute(
        "SELECT * FROM feedbacks ORDER BY id DESC LIMIT ?",
        (limit,)
    ).fetchall()
    conn.close()
    return [dict(item) for item in feedbacks]
        
@app.delete("/tickets/{ticket_id}")
def resolve_ticket(ticket_id: int):
    conn = get_db_connection()
    conn.execute("DELETE FROM tickets WHERE id = ?", (ticket_id,))
    conn.commit()
    conn.close()
    return {"message": "Ticket resolved and removed."}
