# 🎯 NegotiationSim

> **Practice the hard conversation.**
> Sit across an AI opponent. Get a move-by-move debrief on every tactic you used.

---

## 🌑 What It Is

Most people lose negotiations not because they lack information  but because they've never practiced. NegotiationSim puts you across a virtual table from an AI opponent, gives you live feedback on every move, then debriefs the entire session when it's over.

**Three phases:**
1. **Setup**  describe your scenario, goal, and who you're talking to
2. **Table**  exchange messages with the AI; each of your cards shows a live rating in real time
3. **Debrief**  move-by-move analysis, power timeline, three specific takeaways

---

## ✨ Features

- 🃏 **Cards on a table**  messages appear as physical cards, not chat bubbles
- ⚡ **Live ratings** every message you send gets rated instantly (Strong / Weak / Missed + score)
- 📊 **Power bar**  a live balance shifts with every exchange
- 💡 **Suggested replies**  three contextual options after each AI response
- 📋 **Full debrief**  SVG power timeline, color-coded move analysis, three takeaways
- 💾 **Persistent** —sessions saved to SQLite; debrief accessible by ID

---

## 🗂️ Structure

```
negotiationsim/
├── backend/
│   ├── main.py              # FastAPI app + CORS + lifespan
│   ├── database.py          # SQLAlchemy engine, session factory
│   ├── models.py            # Session ORM model
│   ├── routes/
│   │   ├── health.py        # GET /health
│   │   └── negotiation.py   # POST /api/session · /message · /close · GET /session/:id
│   ├── services/
│   │   └── ai_service.py    # exchange() + debrief() — AI integration
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/                # React 18 · TypeScript (strict) · Vite
    └── src/
        ├── App.tsx
        ├── hooks/
        │   └── useNegotiation.ts   # All state in one typed hook
        ├── components/
        │   ├── SetupScreen.tsx     # Dossier entry form
        │   ├── NegotiationTable.tsx# Table + cards + power bar + suggestions
        │   └── DebriefScreen.tsx   # Full debrief with SVG timeline
        ├── lib/api.ts              # Typed Axios client
        ├── types/index.ts          # All TypeScript interfaces
        └── styles/global.css       # Full design system (no framework)
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- An AI API key

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # Add your API_KEY
uvicorn main:app --reload --port 8000
```

API: `http://localhost:8000` · Docs: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` — Vite proxies `/api` to the backend automatically.

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/health` | Health check |
| `POST` | `/api/session` | Start a new session |
| `POST` | `/api/message` | Send a user message, get reply + rating + suggestions |
| `POST` | `/api/close` | Close session and generate debrief |
| `GET`  | `/api/session/:id` | Fetch any session by ID |

**POST `/api/message` response:**
```json
{
  "reply": "AI opponent response...",
  "power_score": 0.62,
  "power_history": [0.5, 0.45, 0.62],
  "user_rating": {
    "rating": "strong",
    "score": 78,
    "explanation": "Good anchor — you cited market data before naming a number."
  },
  "suggestions": [
    "Can you walk me through how that number was calculated?",
    "I'd like to propose we revisit this in writing by Friday.",
    "I understand the constraint — what flexibility do you have on timeline instead?"
  ]
}
```

---

## 🎨 Design System

| Token | Value | Role |
|-------|-------|------|
| `--leather` | `#201610` | Background |
| `--parchment` | `#F0E8D0` | User cards, dossier |
| `--parchment-cool` | `#E8EEF4` | Opponent cards |
| `--gold` | `#C9A84C` | Primary accent |
| `--green-mid` | `#2D7A4E` | Strong moves |
| `--red-mid` | `#C0392B` | Weak moves |

Fonts: Playfair Display · Lora · JetBrains Mono

---

## 🧠 Why AI Is Core

A negotiation opponent that responds realistically to your specific words  not a script  and simultaneously evaluates your tactics, adjusts its power position, and generates relevant follow-up suggestions, all in one call. Remove the AI and the product is an empty table.

---

## 📋 Environment Variables

| Variable | Description |
|----------|-------------|
| `API_KEY` | Your AI API key |

---

## 📄 License

MIT

---

<div align="center">
Built as part of a <a href="#">30-day AI app challenge</a> · by Sahar
</div>
