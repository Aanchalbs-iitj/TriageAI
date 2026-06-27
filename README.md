<div align="center">

<img src="https://img.shields.io/badge/TriageAI-🚀-black?style=for-the-badge" alt="TriageAI" />

# TriageAI

### AI-Powered Customer Support Intelligence Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel&logoColor=white)](https://triage-ai-jade-alpha.vercel.app)
[![API Docs](https://img.shields.io/badge/Swagger%20UI-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://triageai-backend-bqi3.onrender.com/docs)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

*Instantly prioritize tickets · Route to the right team*

</div>

---

## Live Deployment

| | URL |
|---|---|
| **Frontend** | [triage-ai-jade-alpha.vercel.app](https://triage-ai-jade-alpha.vercel.app) |
| **Backend API** | [triageai-backend-bqi3.onrender.com/docs](https://triageai-backend-bqi3.onrender.com/docs) |

> **Note:** The backend is hosted on Render's free tier and may take 30–60 seconds to wake up on the first request after a period of inactivity.

---

## The Problem

Every support team faces the same bottleneck: a flat, undifferentiated queue where *"forgot my password"* sits right next to *"payment failed and I'm being double charged."*

Agents cherry-pick easy tickets. Critical issues wait. Customers churn.

Traditional fixes — tags, SLAs, priority flags — still rely on a human deciding what's urgent *before* any work begins. At scale, that's slow, inconsistent, and expensive.

**TriageAI eliminates the queue entirely.**

The moment a ticket is submitted, an LLM reads it, scores urgency from 1–100, and routes it to the right department — all before a single human lays eyes on it. Agents stop deciding *what* to work on. They just work.

---

## Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI-Powered Routing** | LLM via Groq API assigns a `priority_score` (1–100) and `confidence` score to every incoming ticket in milliseconds |
| 🎫 **Smart Agent Workspace** | Agents click "Pull Next Urgent Ticket" — always receive the single highest-priority open issue for their department. No scrolling, no cherry-picking |
| 🛡 **Manager Review Sandbox** | Tickets with AI confidence < 70% are held in a capped queue of 5 for human approval or spam deletion |
| 🔐 **Role-Based Access Control** | JWT authentication with bcrypt hashing. Strict role-checking on both frontend and backend ensures agents and managers only access their own views |
| 📊 **Real-Time Feedback Loop** | Rolling board of the 9 most recent customer feedback submissions for manager sentiment checks |
| 🗑 **Spam Detection** | Gibberish or off-topic tickets receive near-zero confidence and are automatically quarantined from the live agent queue |

---

## Business Workflow

```
Customer submits ticket
         │
         ▼
  ┌──────────────┐
  │  Groq LLM   │  ← analyzes description + category
  │  Engine     │  ← returns priority (1–100) + confidence (1–100)
  └──────┬───────┘
         │
    ┌────┴────┐
    │         │
confidence  confidence
  ≥ 70%      < 70%
    │         │
    ▼         ▼
 status:   status:
 "Open"   "Needs Review"
    │         │
    │    Manager approves
    │    or marks spam
    │         │
    └────┬────┘
         ▼
  Agent pulls "Next
  Urgent Ticket" for
  their department
         │
         ▼
  Resolved & deleted
```

---

## System Architecture

```
┌──────────────────────────┐          ┌──────────────────────────────────┐
│     React Frontend        │  REST /  │         FastAPI Backend           │
│       (Vercel)            │◄────────►│           (Render)                │
│                           │  JSON    │                                   │
│  · Customer Portal        │          │  POST  /tickets/                  │
│  · Agent Dashboard        │          │  GET   /tickets/next/?category=   │
│  · Manager Sandbox        │          │  GET   /tickets/review/           │
│  · Feedback Page          │          │  PUT   /tickets/{id}/approve      │
│  · Login (JWT)            │          │  DELETE /tickets/{id}             │
└──────────────────────────┘          │  POST  /feedback/                 │
                                       │  GET   /feedback/                 │
                                       │  POST  /login                     │
                                       └────────────┬─────────────────────┘
                                                    │
                                       ┌────────────┴────────────┐
                                       │                         │
                             ┌─────────▼──────────┐   ┌─────────▼──────────┐
                             │    Groq API (LLM)  │   │  SQLite Database   │
                             │  openai/gpt-oss    │   │                    │
                             │                    │   │  · tickets         │
                             │  Returns JSON:     │   │  · feedbacks       │
                             │  { priority,       │   │  · users           │
                             │    confidence }    │   │                    │
                             └────────────────────┘   └────────────────────┘
```

---

## 📁 Project Structure

```
TriageAI/
│
├── backend/
│   ├── main.py          # All API routes, DB schema, AI triage logic
│   ├── auth.py          # bcrypt hashing + JWT token generation (HS256, 60min expiry)
│   ├── requirements.txt
│   ├── tickets.db       # SQLite database — auto-created on first run
│   └── .env             # SECRET_KEY, GROQ_API_KEY  ← never commit this
│
├── frontend/
│   ├── public/
│   │   ├── network-bg.mp4    # Background video — Customer & Feedback pages
│   │   ├── agent-bg.mp4      # Background video — Agent workspace
│   │   └── manager-bg.mp4    # Background video — Manager sandbox & Login
│   ├── src/
│   │   ├── App.jsx       # Root component: routing, state, all API calls
│   │   └── Login.jsx     # Auth form with strict role-checking
│   ├── package.json
│   └── .env             # VITE_API_URL  ← never commit this
│
└── .gitignore
```

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React + Vite | UI framework and dev server |
| Tailwind CSS | Utility-first styling (glassmorphism, dark UI) |
| localStorage | JWT token and role persistence across sessions |
| Vercel | Hosting and deployment |

### Backend
| Technology | Purpose |
|-----------|---------|
| Python / FastAPI | REST API framework |
| SQLite | Persistent storage for tickets, feedbacks, users |
| bcrypt | Password hashing for manager and agent accounts |
| PyJWT | JWT token generation (HS256, 60-minute expiry) |
| python-dotenv | Environment variable management |
| Groq API (`openai/gpt-oss-20b`) | High-speed LLM inference for ticket triage |
| Render | Backend hosting |

---

## 📡 API Reference

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| `POST` | `/login` | ✗ | Authenticate with email + password, returns JWT + role |
| `POST` | `/tickets/` | ✗ | Submit a new ticket — triggers AI triage immediately |
| `GET` | `/tickets/next/` | Agent | Pull the single highest-priority open ticket (`?category=` optional) |
| `GET` | `/tickets/review/` | Manager | Fetch up to 5 low-confidence tickets awaiting human review |
| `PUT` | `/tickets/{id}/approve` | Manager | Approve a flagged ticket and push it to the open queue |
| `DELETE` | `/tickets/{id}` | Agent/Manager | Resolve and permanently remove a ticket |
| `POST` | `/feedback/` | ✗ | Submit platform feedback (rating + comments) |
| `GET` | `/feedback/` | Manager | Fetch the 9 most recent feedback submissions |

> 📖 Full interactive docs with request/response schemas at the [Swagger UI](https://triageai-backend-bqi3.onrender.com/docs)

### AI Triage Payload

Every ticket triggers a call to the Groq API. The LLM returns:

```json
{
  "priority": 85,
  "confidence": 92
}
```

| Field | Range | Meaning |
|-------|-------|---------|
| `priority` | 1–100 | Urgency of the issue. 100 = critical emergency |
| `confidence` | 1–100 | How certain the AI is this is a valid support request. < 70 → routed to Manager review |

---

## 💻 Local Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- A free [Groq API Key](https://console.groq.com/)

### 1. Clone

```bash
git clone https://github.com/Aanchalbs-iitj/TriageAI.git
cd TriageAI
```

### 2. Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload
```

API live at → `http://127.0.0.1:8000`  
Swagger UI at → `http://127.0.0.1:8000/docs`

Create a `.env` file in `backend/`:

```env
SECRET_KEY=any_long_random_string_here
GROQ_API_KEY=your_groq_api_key_here
```

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Random string used to sign and verify JWT tokens |
| `GROQ_API_KEY` | API key from [console.groq.com](https://console.groq.com/) |

> **Note:** On first run, `init_db()` auto-creates `tickets.db` and seeds the two default user accounts.

### 3. Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

App live at → `http://localhost:5173`

Create a `.env` file in `frontend/`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

---

## 🔐 Demo Credentials

> ⚠️ For demonstration only. Change or remove these before any production deployment.

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Manager | `manager@triage.com` | `admin123` | Review sandbox, feedback board |
| Agent | `agent@triage.com` | `agent123` | Department queue, ticket resolution |
| Customer | *(no login required)* | — | Ticket submission, platform feedback |

**How auth works under the hood:**
1. `POST /login` verifies the password against the bcrypt hash stored in SQLite
2. On success, a signed JWT containing `email` and `role` is returned (60-min expiry)
3. The React frontend stores the token in `localStorage` and enforces role-matching — logging in with an agent account while trying to access the manager workspace returns an `Access Denied` error

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: describe your change"`
4. Push and open a Pull Request

Please keep PRs focused — one feature or fix per PR.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Built by [Aanchal Bhaskar Shukla](https://github.com/Aanchalbs-iitj)

</div>