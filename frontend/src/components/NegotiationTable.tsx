import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Message, MoveRating, NegotiationSession } from "../types";

interface Props {
  readonly session: NegotiationSession;
  readonly suggestions: string[];
  readonly onMessage: (content: string) => Promise<void>;
  readonly onClose: () => void;
  readonly sending: boolean;
  readonly closing: boolean;
  readonly error: string | null;
}

// Slight rotations so cards feel physically placed
const CARD_ROTATIONS = [-1.2, 0.8, -0.6, 1.1, -0.9, 0.5, -1.4, 0.7, -0.3, 1.0] as const;

const POWER_LABELS: Array<{ threshold: number; label: string }> = [
  { threshold: 0.75, label: "Strong advantage" },
  { threshold: 0.60, label: "Your leverage" },
  { threshold: 0.40, label: "Balanced" },
  { threshold: 0.25, label: "Their leverage" },
  { threshold: 0,    label: "Their advantage" },
];

function getPowerLabel(score: number): string {
  return (
    POWER_LABELS.find((p) => score >= p.threshold)?.label ?? "Balanced"
  );
}

function getRatingColor(rating: MoveRating["rating"]): string {
  return rating === "strong" ? "#2D7A4E" : rating === "weak" ? "#C0392B" : "#C9A84C";
}

interface CardProps {
  message: Message;
  index: number;
  opponentRole: string;
  rating: MoveRating | null;
}

function MessageCard({ message, index, opponentRole, rating }: CardProps): JSX.Element {
  const isUser = message.role === "user";
  const rot = CARD_ROTATIONS[index % CARD_ROTATIONS.length];

  return (
    <motion.div
      className={`card ${isUser ? "card-user" : "card-them"}`}
      style={{ "--rot": `${rot}deg` } as React.CSSProperties}
      initial={{ opacity: 0, y: isUser ? 24 : -24, rotate: 0, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, rotate: rot, scale: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 220 }}
    >
      <span className="card-from">{isUser ? "YOU" : opponentRole.toUpperCase()}</span>
      <p className="card-text">{message.content}</p>

      {/* Live rating shown on user cards */}
      {isUser && rating && (
        <div className="card-rating" style={{ color: getRatingColor(rating.rating) }}>
          <span className="rating-badge">
            {rating.rating.toUpperCase()} · {rating.score}%
          </span>
          <span className="rating-note">{rating.explanation}</span>
        </div>
      )}
    </motion.div>
  );
}

export default function NegotiationTable({
  session,
  suggestions,
  onMessage,
  onClose,
  sending,
  closing,
  error,
}: Props): JSX.Element {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentPower = session.power_history[session.power_history.length - 1] ?? 0.5;
  const powerPct = Math.round(currentPower * 100);
  const userTurnCount = session.messages.filter((m) => m.role === "user").length;
  const canClose = userTurnCount >= 2;

  // Scroll to latest card
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages.length]);

  async function handleSend(e: FormEvent): Promise<void> {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    await onMessage(text);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend(e as unknown as FormEvent);
    }
  }

  function useSuggestion(text: string): void {
    setInput(text);
    inputRef.current?.focus();
  }

  // Map user messages to their ratings
  let userTurnIdx = -1;
  const ratingsMap = session.messages.reduce<Record<number, MoveRating>>(
    (acc, msg, i) => {
      if (msg.role === "user") {
        userTurnIdx += 1;
        const r = session.move_ratings[userTurnIdx];
        if (r) acc[i] = r;
      }
      return acc;
    },
    {}
  );

  return (
    <motion.div
      className="table-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── Power bar ── */}
      <div className="power-bar">
        <span className="power-side them">THEM {Math.round((1 - currentPower) * 100)}%</span>

        <div className="power-track">
          <motion.div
            className="power-fill"
            animate={{ width: `${powerPct}%` }}
            transition={{ type: "spring", damping: 22, stiffness: 130 }}
          />
          <div className="power-midmark" />
        </div>

        <span className="power-side you">YOU {powerPct}%</span>

        <div className="power-center-label">
          <span className="power-pct">{powerPct}%</span>
          <span className="power-label">{getPowerLabel(currentPower)}</span>
        </div>
      </div>

      {/* ── Top bar ── */}
      <div className="table-topbar">
        <div className="topbar-left">
          <span className="topbar-scenario">{session.scenario}</span>
          <span className="topbar-goal">↳ {session.goal}</span>
        </div>
        <div className="topbar-right">
          <span className="topbar-exchanges">
            {userTurnCount} exchange{userTurnCount !== 1 ? "s" : ""}
          </span>
          {canClose && (
            <button
              className="close-btn"
              onClick={onClose}
              disabled={closing || sending}
            >
              {closing ? "GENERATING DEBRIEF..." : `CLOSE IN ${userTurnCount} →`}
            </button>
          )}
        </div>
      </div>

      {/* ── Table surface ── */}
      <div className="table-surface">
        <div className="table-oval" aria-hidden="true" />

        <div className="label-them">THEM</div>

        <div className="cards-area">
          <AnimatePresence initial={false}>
            {session.messages.map((msg, i) => (
              <MessageCard
                key={i}
                message={msg}
                index={i}
                opponentRole={session.opponent_role}
                rating={ratingsMap[i] ?? null}
              />
            ))}
          </AnimatePresence>

          {session.messages.length === 0 && (
            <p className="table-empty">The table is set. Make your opening move.</p>
          )}
        </div>

        <div className="label-you">YOU</div>
        <div ref={bottomRef} />
      </div>

      {/* ── Suggestions ── */}
      <AnimatePresence>
        {suggestions.length > 0 && !sending && (
          <motion.div
            className="suggestions-bar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="suggestions-label">SUGGESTED REPLIES — TAP TO USE</span>
            <div className="suggestions-list">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="suggestion-chip"
                  onClick={() => useSuggestion(s)}
                  type="button"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input ── */}
      <div className="input-area">
        {error && <p className="input-error">{error}</p>}
        <p className="input-hint">
          {sending ? "Waiting for their response..." : "Your move."}
        </p>
        <form className="input-form" onSubmit={(e) => void handleSend(e)}>
          <textarea
            ref={inputRef}
            className="input-field"
            placeholder="Speak."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={sending}
            maxLength={2000}
          />
          <button
            type="submit"
            className={`send-btn${input.trim() && !sending ? " ready" : ""}`}
            disabled={!input.trim() || sending}
          >
            PLACE ON TABLE
          </button>
        </form>
      </div>
    </motion.div>
  );
}
