import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold">Admin Portal</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/admin/products"
          className="rounded-lg border border-zinc-200 p-5 hover:border-zinc-400 dark:border-zinc-800"
        >
          <h2 className="font-medium">Product Management</h2>
          <p className="mt-1 text-sm text-zinc-500">Create, edit, and delete catalog products.</p>
        </Link>
        <div className="rounded-lg border border-dashed border-zinc-300 p-5 text-zinc-400 dark:border-zinc-700">
          <h2 className="font-medium">Inventory, Promotions, Analytics</h2>
          <p className="mt-1 text-sm">Coming soon — future modules build on the same mock API layer.</p>
        </div>
      </div>
    </main>
  );
}
