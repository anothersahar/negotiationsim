// ── Core domain types ──────────────────────────────────────────────────────

export type Difficulty = "cooperative" | "neutral" | "tough";
export type AppView = "setup" | "table" | "debrief";
export type Rating = "strong" | "weak" | "missed";

export interface Message {
  readonly role: "user" | "assistant";
  readonly content: string;
}

export interface MoveRating {
  readonly rating: Rating;
  readonly score: number; // 0–100
  readonly explanation: string;
}

export interface MoveAnalysis extends MoveRating {
  readonly turn: number;
  readonly message: string;
  readonly alternative?: string;
}

export interface Debrief {
  readonly outcome: string;
  readonly outcome_explanation: string;
  readonly move_analysis: MoveAnalysis[];
  readonly takeaways: readonly string[];
}

export interface NegotiationSession {
  readonly id: number;
  readonly scenario: string;
  readonly goal: string;
  readonly opponent_role: string;
  readonly difficulty: Difficulty;
  readonly messages: Message[];
  readonly power_history: number[];
  readonly move_ratings: MoveRating[];
  readonly status: "active" | "closed";
  readonly debrief: Debrief | null;
  readonly created_at: string;
}

// ── Form / API types ───────────────────────────────────────────────────────

export interface SetupForm {
  scenario: string;
  goal: string;
  opponent_role: string;
  difficulty: Difficulty;
}

export interface ExchangeResponse {
  readonly reply: string;
  readonly power_score: number;
  readonly power_history: number[];
  readonly user_rating: MoveRating;
  readonly suggestions: string[];
}

// ── UI state ───────────────────────────────────────────────────────────────

export interface TableState {
  session: NegotiationSession;
  suggestions: string[];
  lastRating: MoveRating | null;
}
