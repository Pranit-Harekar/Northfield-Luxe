"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, Settings, Shield } from "lucide-react";
import { useCart } from "@/lib/query/cart";
import { useSession } from "@/lib/hooks/useSession";
import { logout } from "@/lib/mock-api/auth";
import { isStaffRole } from "@/lib/auth/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { SiteInfoDialog } from "@/components/site-info-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function NavButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      nativeButton={false}
      render={<Link href={href} />}
    >
      {children}
    </Button>
  );
}

export default function NavBar() {
  const { data: cart } = useCart();
  const session = useSession();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  // Avoid rendering theme-dependent logo before hydration to prevent mismatch.
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount flag, same pattern as ThemeToggle
  useEffect(() => setMounted(true), []);

  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  const staff = isStaffRole(session?.role);
  const logoSrc = mounted && resolvedTheme === "dark" ? "/logo.png" : "/logo-light.png";

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-6 py-4 text-sm">
        <Button
          variant="link"
          size="sm"
          className="gap-2 px-0 text-base font-semibold tracking-tight text-foreground no-underline hover:no-underline"
          nativeButton={false}
          render={<Link href={staff ? "/admin/products" : "/"} />}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt=""
            className="size-6 rounded-md ring-1 ring-border"
          />
          Northfield Luxe
        </Button>

        {staff ? (
          <>
            <NavButton href="/admin/products">Products</NavButton>
            <NavButton href="/admin/users">Users</NavButton>
            <NavButton href="/admin/orders">Orders</NavButton>
            <SiteInfoDialog />
            <NavButton href="/admin/coupons">Coupons</NavButton>
            <NavButton href="/">View storefront</NavButton>
          </>
        ) : (
          <>
            <NavButton href="/">Shop</NavButton>
            <NavButton href="/orders">Orders</NavButton>
            <SiteInfoDialog />
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" className="gap-2" />
                }
              >
                <span className="max-w-40 truncate">{session.name}</span>
                {staff && (
                  <Badge variant="secondary" className="capitalize">
                    {session.role.replace("_", " ")}
                  </Badge>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="space-y-1">
                    <div className="font-medium text-foreground">{session.name}</div>
                    <div className="text-xs font-normal text-muted-foreground">{session.email}</div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                {staff && (
                  <DropdownMenuItem disabled>
                    <Shield className="size-4" />
                    {session.role.replace(/_/g, " ")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuLinkItem
                  render={<Link href="/account" />}
                >
                  <Settings className="size-4" />
                  Account settings
                </DropdownMenuLinkItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" nativeButton={false} render={<Link href="/login" />}>
              Login
            </Button>
          )}
          {!staff && (
            <Button nativeButton={false} render={<Link href="/cart" />} className="gap-2">
              <span>Cart</span>
              <Badge variant="secondary">{itemCount}</Badge>
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
