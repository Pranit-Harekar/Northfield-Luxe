"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, register } from "@/lib/mock-api/auth";
import { homeRouteForRole } from "@/lib/auth/roles";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SEEDED_ACCOUNTS = [
  { email: "customer@atlascommerce.test", password: "password123", role: "Customer" },
  { email: "admin@atlascommerce.test", password: "admin123", role: "Admin" },
] as const;

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
      const session = mode === "login" ? await login(email, password) : await register({ email, password, name });
      router.push(homeRouteForRole(session.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-6 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "login" ? "Log in" : "Create account"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="register-name">Full name</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Full name"
                  // Intentional bug (Category E / login-empty-aria-labels): blank
                  // aria-label values override the placeholder-derived name, leaving
                  // the auth inputs unlabeled to screen readers.
                  aria-label=""
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="Email"
                aria-label=""
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                // Password is intentionally visible (not type="password") so
                // the seeded test-account credentials pre-filled above are
                // readable at a glance in this sandbox environment.
                type="text"
                placeholder="Password"
                aria-label=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Authentication failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col items-start gap-4">
          <Button variant="link" size="sm" className="px-0" onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Need an account? Register" : "Already have an account? Log in"}
          </Button>
          <div className="w-full space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Seeded test accounts</p>
            <div className="overflow-hidden rounded-md border border-border">
              {SEEDED_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(account.password);
                    setMode("login");
                  }}
                  className="flex w-full items-center justify-between gap-3 border-b border-border bg-muted/40 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-muted"
                >
                  <div className="min-w-0">
                    <div className="truncate font-mono text-xs">{account.email}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{account.password}</div>
                  </div>
                  <Badge variant="secondary" className="shrink-0 font-sans">
                    {account.role}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}
