import axios, { type AxiosError } from "axios";
import type {
  ExchangeResponse,
  NegotiationSession,
  SetupForm,
} from "../types";

const http = axios.create({
  baseURL: "/api",
  timeout: 90_000,
  headers: { "Content-Type": "application/json" },
});

function extractMessage(err: unknown): string {
  const axiosErr = err as AxiosError<{ detail?: string }>;
  return (
    axiosErr.response?.data?.detail ??
    axiosErr.message ??
    "Unexpected error. Please retry."
  );
}

export async function createSession(
  form: SetupForm
): Promise<NegotiationSession> {
  try {
    const { data } = await http.post<NegotiationSession>("/session", form);
    return data;
  } catch (err) {
    throw new Error(extractMessage(err));
  }
}

export async function sendMessage(
  sessionId: number,
  content: string
): Promise<ExchangeResponse> {
  try {
    const { data } = await http.post<ExchangeResponse>("/message", {
      session_id: sessionId,
      content,
    });
    return data;
  } catch (err) {
    throw new Error(extractMessage(err));
  }
}

export async function closeSession(
  sessionId: number
): Promise<NegotiationSession> {
  try {
    const { data } = await http.post<NegotiationSession>("/close", {
      session_id: sessionId,
    });
    return data;
  } catch (err) {
    throw new Error(extractMessage(err));
  }
}
