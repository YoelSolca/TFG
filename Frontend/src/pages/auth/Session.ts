// src/pages/auth/Session.ts
import type { User } from "../../models/Auth.model";

const KEY = "session";

export function getSession(): User | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null");
  } catch {
    return null;
  }
}

export function saveSession(user: User) {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export const getToken = () => getSession()?.token ?? null;
