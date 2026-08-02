import { type FormEvent, useState } from "react";
import { motion } from "framer-motion";
import type { Difficulty, SetupForm } from "../types";

interface Props {
  readonly onSubmit: (form: SetupForm) => void;
  readonly loading: boolean;
  readonly error: string | null;
}

interface DifficultyOption {
  value: Difficulty;
  label: string;
  desc: string;
}

const DIFFICULTIES: readonly DifficultyOption[] = [
  { value: "cooperative", label: "Cooperative", desc: "Open, wants a deal" },
  { value: "neutral",     label: "Neutral",     desc: "Professional, measured" },
  { value: "tough",       label: "Tough",       desc: "Strategic, won't fold" },
] as const;

export default function SetupScreen({ onSubmit, loading, error }: Props): JSX.Element {
  const [form, setForm] = useState<SetupForm>({
    scenario: "",
    goal: "",
    opponent_role: "",
    difficulty: "neutral",
  });

  const isValid =
    form.scenario.trim().length >= 5 &&
    form.goal.trim().length >= 3 &&
    form.opponent_role.trim().length >= 2;

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (!isValid || loading) return;
    onSubmit(form);
  }

  function setField<K extends keyof SetupForm>(key: K, value: SetupForm[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <motion.div
      className="setup-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45 }}
    >
      <div className="setup-dots" aria-hidden="true" />

      <motion.div
        className="dossier"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.55, ease: "easeOut" }}
      >
        {/* Dossier header */}
        <div className="dossier-top">
          <span className="dossier-file">CONFIDENTIAL · FILE 001</span>
          <span className="dossier-stamp">CLASSIFIED</span>
        </div>

        <h1 className="dossier-title">NegotiationSim</h1>
        <p className="dossier-sub">Fill the dossier. Then take your seat at the table.</p>

        <form className="dossier-form" onSubmit={handleSubmit} noValidate>
          {/* Scenario */}
          <div className="field">
            <label className="field-label" htmlFor="scenario">
              What are you negotiating?
            </label>
            <input
              id="scenario"
              className="field-input"
              type="text"
              placeholder="salary raise, freelance contract, partnership deal..."
              value={form.scenario}
              onChange={(e) => setField("scenario", e.target.value)}
              maxLength={500}
              autoFocus
              disabled={loading}
            />
          </div>

          {/* Goal */}
          <div className="field">
            <label className="field-label" htmlFor="goal">
              Your goal
            </label>
            <input
              id="goal"
              className="field-input"
              type="text"
              placeholder="What outcome do you want?"
              value={form.goal}
              onChange={(e) => setField("goal", e.target.value)}
              maxLength={500}
              disabled={loading}
            />
          </div>

          {/* Opponent */}
          <div className="field">
            <label className="field-label" htmlFor="opponent">
              Who are you talking to?
            </label>
            <input
              id="opponent"
              className="field-input"
              type="text"
              placeholder="my manager, a prospective client..."
              value={form.opponent_role}
              onChange={(e) => setField("opponent_role", e.target.value)}
              maxLength={200}
              disabled={loading}
            />
          </div>

          {/* Difficulty */}
          <div className="field">
            <label className="field-label">Difficulty</label>
            <div className="diff-row">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  className={`diff-btn${form.difficulty === d.value ? " active" : ""}`}
                  onClick={() => setField("difficulty", d.value)}
                  disabled={loading}
                >
                  <span className="diff-name">{d.label}</span>
                  <span className="diff-desc">{d.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <motion.p
              className="form-error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            className={`sit-btn${isValid && !loading ? " ready" : ""}`}
            disabled={!isValid || loading}
          >
            {loading ? "PREPARING THE TABLE..." : "SIT DOWN"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
