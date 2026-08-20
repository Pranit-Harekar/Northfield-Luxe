"use client";

import Link from "next/link";
import { useCart } from "@/lib/query/cart";
import { useSession } from "@/lib/hooks/useSession";

export default function NavBar() {
  const { data: cart } = useCart();
  const session = useSession();

  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <nav className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4 text-sm">
        <Link href="/" className="text-base font-semibold tracking-tight">
          AtlasCommerce
        </Link>
        <Link href="/" className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
          Shop
        </Link>
        <Link href="/orders" className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
          Orders
        </Link>
        <Link href="/admin" className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
          Admin
        </Link>
        <Link href="/workbench" className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
          Workbench
        </Link>
        <Link href="/testcases" className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
          Test Cases
        </Link>
        <Link href="/defects" className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
          Defects
        </Link>
        <Link href="/swagger" className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
          API Docs
        </Link>
        <div className="ml-auto flex items-center gap-4">
          {session ? (
            <span className="text-zinc-500">Hi, {session.name}</span>
          ) : (
            <Link href="/login" className="text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white">
              Login
            </Link>
          )}
          <Link
            href="/cart"
            className="rounded-full bg-zinc-900 px-4 py-1.5 text-white dark:bg-white dark:text-black"
          >
            Cart ({itemCount})
          </Link>
        </div>
      </nav>
    </header>
  );
}
