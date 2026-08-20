"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, register } from "@/lib/mock-api/auth";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("customer@atlascommerce.test");
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register({ email, password, name });
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-sm flex-1 flex-col justify-center px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold">{mode === "login" ? "Log in" : "Create account"}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {mode === "register" && (
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {pending ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>
      <button
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        className="mt-4 text-xs text-zinc-500 underline"
      >
        {mode === "login" ? "Need an account? Register" : "Already have an account? Log in"}
      </button>
      <p className="mt-6 text-xs text-zinc-400">
        Seeded accounts: customer@atlascommerce.test / password123 · admin@atlascommerce.test / admin123
      </p>
    </main>
  );
}
