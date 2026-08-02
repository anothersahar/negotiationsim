from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String, Text
from database import Base


class Session(Base):
    """Stores a single negotiation practice session end-to-end."""

    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    scenario = Column(String(500), nullable=False)
    goal = Column(String(500), nullable=False)
    opponent_role = Column(String(200), nullable=False)
    difficulty = Column(String(20), nullable=False, default="neutral")

    # Stored as JSON arrays
    messages_json = Column(Text, nullable=False, default="[]")
    power_history_json = Column(Text, nullable=False, default="[0.5]")
    move_ratings_json = Column(Text, nullable=False, default="[]")  # per user turn

    status = Column(String(20), nullable=False, default="active")
    debrief_json = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
