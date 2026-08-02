"""
AI service for NegotiationSim.

Every exchange returns a single structured JSON payload containing:
  - opponent_reply   : the AI's in-character response
  - power_score      : 0.0 (user losing) → 1.0 (user winning)
  - user_rating      : evaluation of the user's last message
  - suggestions      : 3 contextual follow-up lines the user could say next
"""

import json
import os
from typing import Any
import anthropic
from dotenv import load_dotenv

load_dotenv()

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        key = os.getenv("API_KEY")
        if not key:
            raise RuntimeError("API_KEY is not set in environment variables.")
        _client = anthropic.Anthropic(api_key=key)
    return _client


_DIFFICULTY_GUIDE: dict[str, str] = {
    "cooperative": (
        "You are open and want to reach a deal. Respond positively to reasonable proposals. "
        "Push back only on clearly unreasonable requests."
    ),
    "neutral": (
        "You are professional and measured. Neither easy nor hostile. "
        "Never accept the first offer; reveal information slowly."
    ),
    "tough": (
        "You are strategic and deliberate. Never accept the first offer. "
        "Use silence, probing questions, and controlled pressure. "
        "Protect your position; stay professional but unyielding."
    ),
}


def exchange(
    scenario: str,
    goal: str,
    opponent_role: str,
    difficulty: str,
    messages: list[dict[str, str]],
) -> dict[str, Any]:
    """
    Run one negotiation exchange.

    Returns a dict with keys:
        opponent_reply (str), power_score (float),
        user_rating (dict), suggestions (list[str])
    """
    difficulty_note = _DIFFICULTY_GUIDE.get(difficulty, _DIFFICULTY_GUIDE["neutral"])

    system = f"""You are a negotiation opponent in a realistic role-play simulation.

Scenario: {scenario}
Your role: {opponent_role}
User's stated goal: {goal}
Difficulty: {difficulty} — {difficulty_note}

After each user message you must return ONLY a single valid JSON object — no markdown, no extra text.
Start with {{ and end with }}.

Schema:
{{
  "opponent_reply": "your in-character response (2-4 sentences max, conversational, realistic)",
  "power_score": 0.42,
  "user_rating": {{
    "rating": "strong | weak | missed",
    "score": 65,
    "explanation": "one precise sentence on why this move was strong/weak/missed"
  }},
  "suggestions": [
    "contextual follow-up line 1 the user could say next",
    "contextual follow-up line 2",
    "contextual follow-up line 3"
  ]
}}

power_score: 0.0 = user is losing badly, 0.5 = balanced, 1.0 = user is winning clearly.
Shift it dynamically based on what the user actually said — be honest.

user_rating.score: 0–100 representing how effective the user's message was.

suggestions: short, specific lines the user could say next — tailor them to THIS conversation.
They should be diverse: one assertive, one questioning, one conciliatory.

Stay completely in character in opponent_reply. Never break the fourth wall."""

    conversation = [{"role": m["role"], "content": m["content"]} for m in messages]

    client = _get_client()
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=700,
        system=system,
        messages=conversation,
    )

    raw = response.content[0].text.strip()
    clean = raw.replace("```json", "").replace("```", "").strip()
    return json.loads(clean)


def debrief(
    scenario: str,
    goal: str,
    opponent_role: str,
    difficulty: str,
    messages: list[dict[str, str]],
    move_ratings: list[dict[str, Any]],
    final_power: float,
) -> dict[str, Any]:
    """Generate the post-session debrief."""

    outcome = (
        "Strong Close" if final_power >= 0.7
        else "Deal Reached" if final_power >= 0.5
        else "Conceded Too Much" if final_power >= 0.3
        else "Stalemate"
    )

    conversation_text = "\n".join(
        f"{'USER' if m['role'] == 'user' else 'OPPONENT'}: {m['content']}"
        for m in messages
    )

    prompt = f"""Analyze this negotiation practice session.
Return ONLY a valid JSON object. No markdown, no preamble. Start with {{ and end with }}.

Scenario: {scenario}
User goal: {goal}
Opponent: {opponent_role} ({difficulty})
Final power score: {final_power:.2f}
Determined outcome: {outcome}

Conversation:
{conversation_text}

JSON schema:
{{
  "outcome": "{outcome}",
  "outcome_explanation": "one sentence specific to this session",
  "move_analysis": [
    {{
      "turn": 1,
      "message": "exact user message text",
      "rating": "strong | weak | missed",
      "score": 65,
      "explanation": "one precise sentence",
      "alternative": "only for weak/missed — what they should have said"
    }}
  ],
  "takeaways": [
    "specific takeaway 1 from THIS negotiation",
    "specific takeaway 2",
    "specific takeaway 3"
  ]
}}

move_analysis: include ONLY user turns, numbered from 1.
alternative: omit key entirely for "strong" moves."""

    client = _get_client()
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()
    clean = raw.replace("```json", "").replace("```", "").strip()
    return json.loads(clean)
