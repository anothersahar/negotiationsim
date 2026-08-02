import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session as DBSession
from database import get_db
from models import Session
from services import ai_service

router = APIRouter()


# ── Request / Response Schemas ────────────────────────────────────────────────

class SessionCreate(BaseModel):
    scenario: str = Field(..., min_length=5, max_length=500)
    goal: str = Field(..., min_length=3, max_length=500)
    opponent_role: str = Field(..., min_length=2, max_length=200)
    difficulty: str = Field("neutral", pattern="^(cooperative|neutral|tough)$")


class UserMessageRequest(BaseModel):
    session_id: int
    content: str = Field(..., min_length=1, max_length=2000)


class CloseRequest(BaseModel):
    session_id: int


# ── Serializer ────────────────────────────────────────────────────────────────

def _serialize(s: Session) -> dict:
    return {
        "id": s.id,
        "scenario": s.scenario,
        "goal": s.goal,
        "opponent_role": s.opponent_role,
        "difficulty": s.difficulty,
        "messages": json.loads(s.messages_json),
        "power_history": json.loads(s.power_history_json),
        "move_ratings": json.loads(s.move_ratings_json),
        "status": s.status,
        "debrief": json.loads(s.debrief_json) if s.debrief_json else None,
        "created_at": s.created_at.isoformat(),
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/session", status_code=201)
async def create_session(data: SessionCreate, db: DBSession = Depends(get_db)) -> dict:
    session = Session(
        scenario=data.scenario,
        goal=data.goal,
        opponent_role=data.opponent_role,
        difficulty=data.difficulty,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return _serialize(session)


@router.post("/message")
async def send_message(
    data: UserMessageRequest, db: DBSession = Depends(get_db)
) -> dict:
    session = db.query(Session).filter(Session.id == data.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    if session.status != "active":
        raise HTTPException(status_code=409, detail="Session is already closed.")

    messages: list[dict] = json.loads(session.messages_json)
    power_history: list[float] = json.loads(session.power_history_json)
    move_ratings: list[dict] = json.loads(session.move_ratings_json)

    # Add user turn to history before calling AI
    messages.append({"role": "user", "content": data.content})

    try:
        result = ai_service.exchange(
            session.scenario,
            session.goal,
            session.opponent_role,
            session.difficulty,
            messages,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI error: {exc}") from exc

    # Persist AI reply
    messages.append({"role": "assistant", "content": result["opponent_reply"]})
    power_history.append(float(result["power_score"]))
    move_ratings.append(result["user_rating"])

    session.messages_json = json.dumps(messages)
    session.power_history_json = json.dumps(power_history)
    session.move_ratings_json = json.dumps(move_ratings)
    session.updated_at = datetime.utcnow()
    db.commit()

    return {
        "reply": result["opponent_reply"],
        "power_score": result["power_score"],
        "power_history": power_history,
        "user_rating": result["user_rating"],
        "suggestions": result.get("suggestions", []),
    }


@router.post("/close")
async def close_session(
    data: CloseRequest, db: DBSession = Depends(get_db)
) -> dict:
    session = db.query(Session).filter(Session.id == data.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    if session.status == "closed":
        return _serialize(session)

    messages: list[dict] = json.loads(session.messages_json)
    power_history: list[float] = json.loads(session.power_history_json)
    move_ratings: list[dict] = json.loads(session.move_ratings_json)

    if len([m for m in messages if m["role"] == "user"]) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least 2 user messages required to generate a debrief.",
        )

    final_power = power_history[-1] if power_history else 0.5

    try:
        debrief_data = ai_service.debrief(
            session.scenario,
            session.goal,
            session.opponent_role,
            session.difficulty,
            messages,
            move_ratings,
            final_power,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail=f"Debrief generation failed: {exc}"
        ) from exc

    session.status = "closed"
    session.debrief_json = json.dumps(debrief_data)
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return _serialize(session)


@router.get("/session/{session_id}")
async def get_session(session_id: int, db: DBSession = Depends(get_db)) -> dict:
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    return _serialize(session)
