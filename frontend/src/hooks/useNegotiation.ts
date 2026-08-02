import { useCallback, useState } from "react";
import { createSession, sendMessage, closeSession } from "../lib/api";
import type {
  AppView,
  MoveRating,
  NegotiationSession,
  SetupForm,
} from "../types";

interface NegotiationState {
  view: AppView;
  session: NegotiationSession | null;
  suggestions: string[];
  lastRating: MoveRating | null;
  sending: boolean;
  closing: boolean;
  error: string | null;
}

interface NegotiationActions {
  startSession: (form: SetupForm) => Promise<void>;
  sendUserMessage: (content: string) => Promise<void>;
  finishSession: () => Promise<void>;
  reset: () => void;
}

const INITIAL_STATE: NegotiationState = {
  view: "setup",
  session: null,
  suggestions: [],
  lastRating: null,
  sending: false,
  closing: false,
  error: null,
};

export function useNegotiation(): NegotiationState & NegotiationActions {
  const [state, setState] = useState<NegotiationState>(INITIAL_STATE);

  const startSession = useCallback(async (form: SetupForm) => {
    setState((s) => ({ ...s, error: null, sending: true }));
    try {
      const session = await createSession(form);
      setState((s) => ({ ...s, session, view: "table", sending: false }));
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : "Failed to start session.",
        sending: false,
      }));
    }
  }, []);

  const sendUserMessage = useCallback(
    async (content: string) => {
      setState((s) => ({ ...s, sending: true, error: null }));
      try {
        const result = await sendMessage(state.session!.id, content);
        setState((s) => {
          if (!s.session) return s;
          const updated: NegotiationSession = {
            ...s.session,
            messages: [
              ...s.session.messages,
              { role: "user", content },
              { role: "assistant", content: result.reply },
            ],
            power_history: result.power_history,
            move_ratings: [...s.session.move_ratings, result.user_rating],
          };
          return {
            ...s,
            session: updated,
            suggestions: result.suggestions,
            lastRating: result.user_rating,
            sending: false,
          };
        });
      } catch (err) {
        setState((s) => ({
          ...s,
          error:
            err instanceof Error ? err.message : "Failed to send message.",
          sending: false,
        }));
      }
    },
    [state.session]
  );

  const finishSession = useCallback(async () => {
    if (!state.session) return;
    setState((s) => ({ ...s, closing: true, error: null }));
    try {
      const closed = await closeSession(state.session.id);
      setState((s) => ({ ...s, session: closed, view: "debrief", closing: false }));
    } catch (err) {
      setState((s) => ({
        ...s,
        error:
          err instanceof Error ? err.message : "Failed to generate debrief.",
        closing: false,
      }));
    }
  }, [state.session]);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return { ...state, startSession, sendUserMessage, finishSession, reset };
}
