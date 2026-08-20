"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";
import { createMockFetch } from "@/lib/mock-api/swagger-bridge";

// swagger-ui-react touches `window` at module load time, so it must be
// loaded client-side only.
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

// Patched synchronously at module scope (not inside an effect) so it's in
// place before SwaggerUI's own child effects fire their first fetches —
// effects run bottom-up (children before parents), so a parent useEffect
// would patch too late. This module only ever loads on this one page.
let originalFetch: typeof window.fetch | undefined;
function patchFetchForMockApi() {
  if (typeof window === "undefined" || originalFetch) return;
  originalFetch = window.fetch.bind(window);
  const mockFetch = createMockFetch();
  const realFetch = originalFetch;
  // Only /api/* requests are rerouted into the real mock API (IndexedDB) —
  // everything else (the spec file itself, Swagger's own assets) still goes
  // through the real fetch untouched.
  window.fetch = (input, init) => {
    const url = new URL(
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      window.location.origin,
    );
    return url.pathname.startsWith("/api/") ? mockFetch(input, init) : realFetch(input, init);
  };
}
patchFetchForMockApi();

export default function SwaggerPage() {
  useEffect(() => {
    return () => {
      if (originalFetch) {
        window.fetch = originalFetch;
        originalFetch = undefined;
      }
    };
  }, []);

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-6 pt-6">
        <div className="rounded-md border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
          &quot;Execute&quot; here runs directly against this browser tab&apos;s real mock API
          (IndexedDB) — the same data and logic the rest of the app uses, not a separate
          server. Changes you make (creating, deleting, refunding, etc.) are real and
          persist. Logging in here sets the same session used elsewhere in the app. Stock
          transfers (<code>POST /api/transfers</code>) aren&apos;t implemented anywhere in
          this sandbox and will return a 501.
        </div>
      </div>
      <SwaggerUI url="/openapi.json" />
    </main>
  );
}
