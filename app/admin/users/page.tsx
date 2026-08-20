"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Role, User } from "@/lib/db/types";
import { useSession } from "@/lib/hooks/useSession";
import { useDeleteUser, useUpdateUser, useUsers } from "@/lib/query/users";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/data-table";

const ROLES: { value: Role; label: string }[] = [
  { value: "customer", label: "Customer" },
  { value: "support_agent", label: "Support agent" },
  { value: "inventory_manager", label: "Inventory manager" },
  { value: "store_admin", label: "Store admin" },
  { value: "super_admin", label: "Super admin" },
];

function roleLabel(role: Role): string {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

function SortableHeader({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={onClick}>
      {label}
      <ArrowUpDown className="size-3.5" />
    </Button>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense>
      <AdminUsersPageContent />
    </Suspense>
  );
}

function AdminUsersPageContent() {
  const session = useSession();
  const { data: users, isLoading } = useUsers();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const searchParams = useSearchParams();
  const highlightUserId = searchParams.get("highlight");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<Role>("customer");

  function openEdit(user: User) {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
  }

  // Deep-linked from an order's "Customer" link — auto-open the edit dialog
  // for the referenced user once the list has loaded.
  useEffect(() => {
    if (!highlightUserId || !users) return;
    const target = users.find((u) => u.id === highlightUserId);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time deep-link open, not a render-loop update
    if (target) openEdit(target);
  }, [highlightUserId, users]);

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser || !editName || !editEmail) return;
    try {
      await updateUser.mutateAsync({
        id: editingUser.id,
        patch: { name: editName, email: editEmail, role: editRole },
      });
      toast.success("User updated");
      setEditingUser(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user");
    }
  }

  async function handleDelete(userId: string) {
    try {
      await deleteUser.mutateAsync(userId);
      toast.success("User deleted. Their past orders were archived, not removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    }
  }

  const filteredUsers = (users ?? []).filter((user) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = term
      ? user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)
      : true;
    const matchesRole = roleFilter === "all" ? true : user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader label="Name" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => {
        const user = row.original;
        const isSelf = user.id === session?.userId;
        return (
          <span className="font-medium">
            {user.name}
            {isSelf && (
              <Badge variant="outline" className="ml-2">
                You
              </Badge>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <SortableHeader label="Email" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="secondary" className="capitalize">
          {roleLabel(row.original.role)}
        </Badge>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader label="Joined" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const user = row.original;
        const isSelf = user.id === session?.userId;
        return (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="icon-xs" aria-label="Edit user" onClick={() => openEdit(user)}>
              <Pencil className="size-3" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button variant="destructive" size="icon-xs" aria-label="Delete user" disabled={isSelf} />}
              >
                <Trash2 className="size-3" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {user.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes their account and login access. Their past orders are kept and marked archived
                    rather than deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(user.id)}>Delete user</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">User Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every account registered on the storefront.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={roleFilter} onValueChange={(value) => value && setRoleFilter(value as Role | "all")}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DataTable
            columns={columns}
            data={filteredUsers}
            emptyMessage="No users match your search."
            headClassName="h-12 px-4 text-sm"
            cellClassName="px-4 py-4"
          />
        </>
      )}

      <Dialog open={editingUser !== null} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="edit-user-name">Name</FieldLabel>
                <Input
                  id="edit-user-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-user-email">Email</FieldLabel>
                <Input
                  id="edit-user-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Role</FieldLabel>
                <Select
                  value={editRole}
                  onValueChange={(value) => value && setEditRole(value as Role)}
                  disabled={editingUser?.id === session?.userId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
