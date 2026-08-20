"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Shield } from "lucide-react";
import { useCart } from "@/lib/query/cart";
import { useSession } from "@/lib/hooks/useSession";
import { logout } from "@/lib/mock-api/auth";
import { isStaffRole } from "@/lib/auth/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  const staff = isStaffRole(session?.role);

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
          className="px-0 text-base font-semibold tracking-tight text-foreground no-underline hover:no-underline"
          nativeButton={false}
          render={<Link href={staff ? "/admin" : "/"} />}
        >
          AtlasCommerce
        </Button>

        {staff ? (
          <>
            <NavButton href="/admin">Dashboard</NavButton>
            <NavButton href="/admin/products">Products</NavButton>
            <NavButton href="/swagger">API Docs</NavButton>
            <NavButton href="/">View storefront</NavButton>
          </>
        ) : (
          <>
            <NavButton href="/">Shop</NavButton>
            <NavButton href="/orders">Orders</NavButton>
            <NavButton href="/swagger">API Docs</NavButton>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
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
                <DropdownMenuLabel className="space-y-1">
                  <div className="font-medium text-foreground">{session.name}</div>
                  <div className="text-xs font-normal text-muted-foreground">{session.email}</div>
                </DropdownMenuLabel>
                {staff && (
                  <DropdownMenuItem disabled>
                    <Shield className="size-4" />
                    {session.role.replace(/_/g, " ")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/login" />}>
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
