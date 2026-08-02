import { motion } from "framer-motion";
import type { MoveAnalysis, NegotiationSession } from "../types";

interface Props {
  readonly session: NegotiationSession;
  readonly onReset: () => void;
}

interface RatingConfig {
  label: string;
  color: string;
  border: string;
  bg: string;
}

const RATING_CFG: Record<string, RatingConfig> = {
  strong: { label: "STRONG", color: "#2D7A4E", border: "#2D7A4E", bg: "rgba(26,74,46,0.1)"  },
  weak:   { label: "WEAK",   color: "#C0392B", border: "#C0392B", bg: "rgba(192,57,43,0.1)"  },
  missed: { label: "MISSED", color: "#C9A84C", border: "#C9A84C", bg: "rgba(201,168,76,0.08)" },
} as const;

const OUTCOME_STYLE: Record<string, { color: string; border: string }> = {
  "Strong Close":      { color: "#2D7A4E", border: "#2D7A4E" },
  "Deal Reached":      { color: "#2D7A4E", border: "#2D7A4E" },
  "Conceded Too Much": { color: "#C0392B", border: "#C0392B" },
  "Stalemate":         { color: "#C9A84C", border: "#C9A84C" },
} as const;

// SVG Power Timeline
function PowerTimeline({ history }: { history: number[] }): JSX.Element | null {
  if (history.length < 2) return null;

  const W = 560;
  const H = 72;
  const PAD = 16;
  const iW = W - PAD * 2;

  const xs = history.map((_, i) => PAD + (i / (history.length - 1)) * iW);
  const ys = history.map((v) => H - PAD - v * (H - PAD * 2));

  const d =
    `M ${xs[0]},${ys[0]} ` +
    xs
      .slice(1)
      .map((x, i) => {
        const cx = (xs[i] + x) / 2;
        return `C ${cx},${ys[i]} ${cx},${ys[i + 1]} ${x},${ys[i + 1]}`;
      })
      .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="power-timeline-svg"
      preserveAspectRatio="none"
      aria-label="Power timeline chart"
    >
      {/* Baseline */}
      <line
        x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2}
        stroke="rgba(201,168,76,0.2)" strokeWidth="1" strokeDasharray="4 3"
      />
      {/* Area fill */}
      <path
        d={`${d} L ${xs[xs.length - 1]},${H / 2} L ${xs[0]},${H / 2} Z`}
        fill="rgba(201,168,76,0.07)"
      />
      {/* Line */}
      <path d={d} fill="none" stroke="#C9A84C" strokeWidth="1.5" opacity={0.85} />
      {/* Dots */}
      {history.map((v, i) => (
        <circle
          key={i}
          cx={xs[i]} cy={ys[i]} r={3}
          fill={v >= 0.5 ? "#2D7A4E" : "#C0392B"}
          stroke="#C9A84C" strokeWidth="1"
        />
      ))}
      <text x={PAD} y={10} fontSize="7" fill="rgba(201,168,76,0.5)"
        fontFamily="JetBrains Mono">YOUR ADVANTAGE ↑</text>
      <text x={PAD} y={H - 2} fontSize="7" fill="rgba(192,57,43,0.5)"
        fontFamily="JetBrains Mono">THEIR ADVANTAGE ↓</text>
    </svg>
  );
}

// Individual move card
function MoveCard({ move, index }: { move: MoveAnalysis; index: number }): JSX.Element {
  const cfg = RATING_CFG[move.rating] ?? RATING_CFG.weak;
  return (
    <motion.div
      className="move-card"
      style={{ borderLeftColor: cfg.border, background: cfg.bg }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 + index * 0.07 }}
    >
      <div className="move-head">
        <span className="move-turn">TURN {move.turn}</span>
        <span className="move-badge" style={{ color: cfg.color, borderColor: cfg.border }}>
          {cfg.label} · {move.score}%
        </span>
      </div>
      <p className="move-msg">"{move.message}"</p>
      <p className="move-explain">{move.explanation}</p>
      {move.alternative && (
        <p className="move-alt">
          <span className="move-alt-label">INSTEAD → </span>
          {move.alternative}
        </p>
      )}
    </motion.div>
  );
}

export default function DebriefScreen({ session, onReset }: Props): JSX.Element {
  const { debrief, power_history } = session;
  if (!debrief) return <></>;

  const outcomeStyle = OUTCOME_STYLE[debrief.outcome] ?? OUTCOME_STYLE["Deal Reached"];

  return (
    <motion.div
      className="debrief-screen"
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="debrief-inner">
        {/* Header */}
        <header className="debrief-header">
          <div>
            <span className="debrief-eyebrow">POST-NEGOTIATION DEBRIEF</span>
            <p className="debrief-meta">
              {session.scenario} · {session.opponent_role} · {session.difficulty}
            </p>
          </div>
          <button className="debrief-reset" onClick={onReset} type="button">
            ← New Session
          </button>
        </header>

        {/* Outcome stamp */}
        <motion.section
          className="outcome-section"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div
            className="outcome-stamp"
            style={{ color: outcomeStyle.color, borderColor: outcomeStyle.border }}
          >
            {debrief.outcome}
          </div>
          <p className="outcome-explain">{debrief.outcome_explanation}</p>
        </motion.section>

        {/* Power timeline */}
        <motion.section
          className="debrief-section"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="section-heading">POWER TIMELINE</h2>
          <PowerTimeline history={power_history} />
        </motion.section>

        {/* Move analysis */}
        <motion.section
          className="debrief-section"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h2 className="section-heading">MOVE-BY-MOVE</h2>
          <div className="moves-list">
            {debrief.move_analysis.map((move, i) => (
              <MoveCard key={i} move={move} index={i} />
            ))}
          </div>
        </motion.section>

        {/* Takeaways */}
        <motion.section
          className="debrief-section takeaways"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="section-heading">THREE THINGS TO REMEMBER</h2>
          <ol className="takeaway-list">
            {debrief.takeaways.map((t, i) => (
              <li key={i} className="takeaway-item">
                <span className="takeaway-num">{String(i + 1).padStart(2, "0")}</span>
                <p className="takeaway-text">{t}</p>
              </li>
            ))}
          </ol>
        </motion.section>

        {/* CTA */}
        <div className="debrief-cta">
          <button className="restart-btn" onClick={onReset} type="button">
            SIT DOWN AGAIN →
          </button>
        </div>
      </div>
    </motion.div>
  );
}
