"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { seedDatabase } from "@/lib/db/seed";

export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedDatabase().finally(() => setReady(true));
  }, []);

  return (
    <QueryClientProvider client={client}>
      {ready ? children : <SeedingScreen />}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

function SeedingScreen() {
  return (
    <div className="flex flex-1 items-center justify-center py-32 text-sm text-zinc-500">
      Preparing your AtlasCommerce environment…
    </div>
  );
}
