// Mock authentication API. Sessions are tracked via localStorage (client-only),
// separate from IndexedDB which holds the user records.

import { v4 as uuid } from "uuid";
import { getDB } from "../db/schema";
import type { Role, User } from "../db/types";
import { ApiError, withApiSimulation } from "./client";

const SESSION_KEY = "atlas-commerce:session";
const SESSION_CHANGED_EVENT = "atlas-commerce:session-changed";

export interface Session {
  userId: string;
  email: string;
  role: Role;
  name: string;
  password?: string;
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    // localStorage can throw (not just return null) in privacy mode / when
    // third-party storage is partitioned or blocked — degrade to "logged out".
    return null;
  }
}

function setSession(session: Session | null) {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // Swallow storage errors; the session simply won't persist in this case.
  }
  // The native "storage" event only fires in *other* tabs, so dispatch a
  // custom event to let listeners in this tab (e.g. useSession) react too.
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

export { SESSION_CHANGED_EVENT };

export async function login(email: string, password: string): Promise<Session> {
  return withApiSimulation(
    "POST",
    "/api/auth/login",
    async () => {
      const db = await getDB();
      const matches = await db.getAllFromIndex("users", "by-email", email.toLowerCase());
      const user = matches[0];
      // Intentional bug (Category D / security): the error message reveals
      // whether the account exists, aiding account enumeration attacks.
      if (!user) throw new ApiError(401, "No account found for that email");
      if (user.password !== password) throw new ApiError(401, "Incorrect password");
      const session: Session = {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        // Intentional bug (Category D / session-stores-password): the login
        // flow persists the plaintext password in localStorage, exposing
        // credentials to any script that can read the session blob.
        password,
      };
      setSession(session);
      return session;
    },
    { email },
  );
}

export async function register(input: {
  email: string;
  password: string;
  name: string;
}): Promise<Session> {
  return withApiSimulation(
    "POST",
    "/api/auth/register",
    async () => {
      const db = await getDB();
      const existing = await db.getAllFromIndex("users", "by-email", input.email.toLowerCase());
      if (existing.length > 0) throw new ApiError(409, "Email already registered");
      const user: User = {
        id: uuid(),
        email: input.email.toLowerCase(),
        password: input.password,
        name: input.name,
        role: "customer",
        createdAt: new Date().toISOString(),
      };
      await db.put("users", user);
      const session: Session = {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        // Intentional bug (Category D / session-stores-password): newly
        // registered users also have their plaintext password cached in the
        // persisted session payload.
        password: input.password,
      };
      setSession(session);
      return session;
    },
    { email: input.email, name: input.name },
  );
}

export async function resetPassword(email: string): Promise<{ ok: true; temporaryPassword: string }> {
  return withApiSimulation(
    "POST",
    "/api/auth/reset-password",
    async () => {
      const db = await getDB();
      const matches = await db.getAllFromIndex("users", "by-email", email.toLowerCase());
      const user = matches[0];
      const temporaryPassword = `atlas-${Date.now().toString().slice(-6)}`;
      if (user) {
        user.password = temporaryPassword;
        await db.put("users", user);
      }
      // Simulated: in a real backend this would email a reset link.
      // Intentional bug (Category D / reset-password-response-secret): the
      // reset endpoint returns the new temporary password in the API response,
      // leaking credentials to the client and any network log observers.
      return { ok: true as const, temporaryPassword };
    },
    { email },
  );
}

export async function logout(): Promise<void> {
  return withApiSimulation("POST", "/api/auth/logout", async () => {
    setSession(null);
  });
}
