"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpenText,
  ClipboardList,
  Info,
  KeyRound,
  RotateCcw,
  ShieldQuestion,
  Sparkles,
  TestTube2,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { resetDB } from "@/lib/db/schema";
import { seedDatabase } from "@/lib/db/seed";
import { logout } from "@/lib/mock-api/auth";

/** Small pulsating colored dot + info icon that opens a modal explaining what
 * this site is for and pointing QAs to useful resources (API docs, seeded
 * test accounts, etc). Replaces the old top-level "API Docs" nav link. */
const SEEDED_ACCOUNTS = [
  { email: "customer@atlascommerce.test", password: "password123", role: "Customer" },
  { email: "admin@atlascommerce.test", password: "admin123", role: "Admin" },
] as const;

export function SiteInfoDialog() {
  const [isResetting, setIsResetting] = useState(false);

  async function handleReset() {
    setIsResetting(true);
    try {
      await logout();
      await resetDB();
      await seedDatabase({ force: true });
      toast.success("Environment reset — reloading with fresh test data…");
      // Intentional full page load (not client-side routing): clears the
      // React Query cache and any other in-memory state so the app reflects
      // the freshly-reseeded data instead of stale cached queries.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset the environment");
      setIsResetting(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="About this site & QA resources"
            className="relative"
          />
        }
      >
        <span className="absolute right-0.5 top-0.5 flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        <Info className="size-4.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldQuestion className="size-5 text-emerald-500" />
            <DialogTitle>About Northfield Luxe</DialogTitle>
          </div>
          <DialogDescription>
            A sandbox commerce site built for hands-on QA practice — not a real store.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Northfield Luxe is a fully working storefront and admin portal, seeded with
            realistic products, orders, coupons, and users. It exists so QAs and testers
            can explore flows end-to-end (browsing, cart, checkout, refunds, admin
            management) and practice finding issues in a safe environment.
          </p>

          <Separator />

          <div className="space-y-2">
            <p className="flex items-center gap-1.5 font-medium">
              <TestTube2 className="size-4 text-muted-foreground" />
              What you can test here
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Functional",
                "UI / visual",
                "Accessibility",
                "Cross-role & permissions",
                "Form validation",
                "Edge cases & negative testing",
                "API / contract",
                "Responsive & dark mode",
                "Regression",
              ].map((label) => (
                <Badge key={label} variant="outline" className="font-normal">
                  {label}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              The catalog, cart, checkout, refunds, coupons, and admin tools are all live —
              poke around each flow and role to see what breaks.
            </p>
          </div>

          <Separator />

          <div className="space-y-2.5">
            <p className="flex items-center gap-1.5 font-medium">
              <Sparkles className="size-4 text-muted-foreground" />
              Resources
            </p>
            <div className="flex flex-wrap gap-2">
              <DialogClose
                render={
                  <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/swagger" />} className="gap-1.5" />
                }
              >
                <BookOpenText className="size-3.5" />
                API docs
              </DialogClose>
              <DialogClose
                render={
                  <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/openapi.json" />} className="gap-1.5" />
                }
              >
                <ClipboardList className="size-3.5" />
                OpenAPI spec
              </DialogClose>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="flex items-center gap-1.5 font-medium">
              <KeyRound className="size-4 text-muted-foreground" />
              Seeded test accounts
            </p>
            <div className="overflow-hidden rounded-md border border-border">
              {SEEDED_ACCOUNTS.map((account) => (
                <div
                  key={account.email}
                  className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-3 py-2 last:border-b-0"
                >
                  <div className="min-w-0">
                    <div className="truncate font-mono text-xs">{account.email}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{account.password}</div>
                  </div>
                  <Badge variant="secondary" className="shrink-0 font-sans">
                    {account.role}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="flex items-center gap-1.5 font-medium">
              <RotateCcw className="size-4 text-muted-foreground" />
              Danger zone
            </p>
            <p className="text-xs text-muted-foreground">
              Wipes every seeded and test-generated product, order, user, coupon, and
              session, then reseeds a fresh baseline dataset. Useful for starting a test
              pass from a known-clean state.
            </p>
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button size="sm" variant="destructive" disabled={isResetting} className="gap-1.5" />}
              >
                <RotateCcw className="size-3.5" />
                {isResetting ? "Resetting…" : "Reset environment"}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset the entire environment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently clears all products, orders, users, coupons, and your
                    current login session in this browser, then reseeds fresh sample data.
                    This can&apos;t be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset}>Reset environment</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
