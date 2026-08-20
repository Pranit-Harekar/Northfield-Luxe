"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/hooks/useSession";
import { isStaffRole } from "@/lib/auth/roles";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

/**
 * Admin Portal is a distinct interface from the shopper storefront — only
 * staff roles (support agent, inventory manager, store admin, super admin)
 * should land here. Customers get redirected back to the storefront, and
 * logged-out visitors are sent to log in first.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session === null) {
      router.replace("/login");
    } else if (!isStaffRole(session.role)) {
      router.replace("/");
    }
  }, [session, router]);

  if (!session || !isStaffRole(session.role)) {
    return (
      <main className="mx-auto flex max-w-3xl flex-1 items-center px-6 py-8">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center gap-3 py-8 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            Redirecting…
          </CardContent>
        </Card>
      </main>
    );
  }

  return <>{children}</>;
}
