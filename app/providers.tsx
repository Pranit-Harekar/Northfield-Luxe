"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TriangleAlert } from "lucide-react";
import { seedDatabase } from "@/lib/db/seed";
import { checkStorageAvailability } from "@/lib/storage-check";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type InitState =
  | { status: "checking" }
  | { status: "ready" }
  | { status: "blocked"; availability: { localStorage: boolean; indexedDB: boolean } }
  | { status: "error"; message: string };

export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }));
  const [state, setState] = useState<InitState>({ status: "checking" });

  // Does not call setState synchronously before its first await, so it's
  // safe to invoke directly from the mount effect below.
  const runInit = useCallback(async () => {
    // Northfield Luxe has no real backend: everything lives in this browser's
    // localStorage (auth sessions) and IndexedDB (products, orders, users,
    // etc). If either is blocked — private browsing, "block site data"
    // settings, a sandboxed iframe — the app has nowhere to store data, so we
    // detect that up front and tell the user, instead of silently rendering
    // a broken app (e.g. seeded login accounts that were never persisted).
    const availability = await checkStorageAvailability();
    if (!availability.localStorage || !availability.indexedDB) {
      setState({ status: "blocked", availability });
      return;
    }

    try {
      await seedDatabase();
      setState({ status: "ready" });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to prepare the Northfield Luxe environment.",
      });
    }
  }, []);

  useEffect(() => {
    // runInit is async and only calls setState after its first await (or not
    // at all before it), so this is a standard fetch-on-mount effect; the
    // compiler's static analysis can't see across that boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runInit();
  }, [runInit]);

  const handleRetry = useCallback(() => {
    setState({ status: "checking" });
    runInit();
  }, [runInit]);

  return (
    <QueryClientProvider client={client}>
      {state.status === "ready" ? children : <InitScreen state={state} onRetry={handleRetry} />}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

function InitScreen({ state, onRetry }: { state: InitState; onRetry: () => void }) {
  if (state.status === "checking") {
    return (
      <div className="flex flex-1 items-center justify-center py-32 text-sm text-muted-foreground">
        Preparing your Northfield Luxe environment…
      </div>
    );
  }

  const isBlocked = state.status === "blocked";

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-32">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TriangleAlert className="size-5 text-destructive" />
            Storage access required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Northfield Luxe stores everything — your login session, cart, and orders — directly in this browser
            using localStorage and IndexedDB. It looks like this site can&apos;t access one or both right now.
          </p>
          {isBlocked && (
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <span className={state.availability.localStorage ? "text-green-600" : "text-destructive"}>
                  {state.availability.localStorage ? "✓" : "✕"}
                </span>
                localStorage
              </li>
              <li className="flex items-center gap-2">
                <span className={state.availability.indexedDB ? "text-green-600" : "text-destructive"}>
                  {state.availability.indexedDB ? "✓" : "✕"}
                </span>
                IndexedDB
              </li>
            </ul>
          )}
          {state.status === "error" && (
            <Alert variant="destructive">
              <AlertTitle>Setup failed</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          <p className="text-sm text-muted-foreground">
            Try disabling private/incognito mode, allowing cookies and site data for this site, or opening it
            outside of a restricted embed — then retry.
          </p>
          <Button onClick={onRetry} className="w-full">
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
