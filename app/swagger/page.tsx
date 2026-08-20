"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

// swagger-ui-react touches `window` at module load time, so it must be
// loaded client-side only.
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function SwaggerPage() {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-6 pt-6">
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          This spec documents the contract of Northfield Luxe&apos;s mock API, which is
          simulated entirely in the browser (IndexedDB) — there is no real server behind
          these paths, so the &quot;Execute&quot; button here can&apos;t make live calls and
          will always fail. To exercise the API for real, use your browser&apos;s
          devtools Network tab while using the app, or call the functions in{" "}
          <code>lib/mock-api</code> directly.
        </div>
      </div>
      {/* "Try it out" / Execute is disabled (supportedSubmitMethods=[]) since there is
          no live server for this spec to call — see the banner above. */}
      <SwaggerUI url="/openapi.json" supportedSubmitMethods={[]} />
    </main>
  );
}
