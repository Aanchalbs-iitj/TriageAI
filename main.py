from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "System Online: TriageAI Backend is running."}

@app.post("/tickets/")
def create_ticket(description: str):
    return {
        "status": "Ticket Received",
        "original_text": description,
        "ai_priority": "Pending"
    }