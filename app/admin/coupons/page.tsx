"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Coupon } from "@/lib/db/types";
import { useCoupons, useCreateCoupon, useDeleteCoupon, useUpdateCoupon } from "@/lib/query/coupons";
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
import { Switch } from "@/components/ui/switch";
import { DataTable } from "@/components/data-table";

type CouponType = Coupon["type"];

const COUPON_TYPES: { value: CouponType; label: string }[] = [
  { value: "percentage", label: "Percentage off" },
  { value: "fixed", label: "Fixed amount off" },
  { value: "bogo", label: "Buy one, get one" },
];

type StatusFilter = "all" | "active" | "inactive" | "expired";

function isExpired(coupon: Coupon): boolean {
  return Boolean(coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now());
}

function typeLabel(type: CouponType): string {
  return COUPON_TYPES.find((t) => t.value === type)?.label ?? type;
}

function formatValue(coupon: Coupon): string {
  if (coupon.type === "percentage") return `${coupon.value}% off`;
  if (coupon.type === "fixed") return `$${(coupon.value / 100).toFixed(2)} off`;
  return "BOGO";
}

interface CouponDraft {
  code: string;
  type: CouponType;
  value: string;
  active: boolean;
  expiresAt: string; // yyyy-mm-dd or ""
}

function emptyDraft(): CouponDraft {
  return { code: "", type: "percentage", value: "", active: true, expiresAt: "" };
}

function draftFromCoupon(coupon: Coupon): CouponDraft {
  return {
    code: coupon.code,
    type: coupon.type,
    value: String(coupon.type === "fixed" ? coupon.value / 100 : coupon.value),
    active: coupon.active,
    expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
  };
}

function draftToPatch(draft: CouponDraft): Omit<Coupon, "id"> {
  const numericValue = Number(draft.value) || 0;
  return {
    code: draft.code.trim().toUpperCase(),
    type: draft.type,
    value: draft.type === "fixed" ? Math.round(numericValue * 100) : numericValue,
    active: draft.active,
    expiresAt: draft.expiresAt ? new Date(draft.expiresAt).toISOString() : null,
  };
}

function SortableHeader({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={onClick}>
      {label}
      <ArrowUpDown className="size-3.5" />
    </Button>
  );
}

export default function AdminCouponsPage() {
  const { data: coupons, isLoading } = useCoupons();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<CouponDraft>(emptyDraft());

  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editDraft, setEditDraft] = useState<CouponDraft>(emptyDraft());

  function openEdit(coupon: Coupon) {
    setEditingCoupon(coupon);
    setEditDraft(draftFromCoupon(coupon));
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!createDraft.code.trim()) return;
    try {
      await createCoupon.mutateAsync(draftToPatch(createDraft));
      toast.success("Coupon created");
      setCreateOpen(false);
      setCreateDraft(emptyDraft());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create coupon");
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCoupon || !editDraft.code.trim()) return;
    try {
      await updateCoupon.mutateAsync({ id: editingCoupon.id, patch: draftToPatch(editDraft) });
      toast.success("Coupon updated");
      setEditingCoupon(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update coupon");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCoupon.mutateAsync(id);
      toast.success("Coupon deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete coupon");
    }
  }

  const filteredCoupons = (coupons ?? []).filter((coupon) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = term ? coupon.code.toLowerCase().includes(term) : true;
    const expired = isExpired(coupon);
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "expired"
          ? expired
          : statusFilter === "active"
            ? coupon.active && !expired
            : !coupon.active;
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnDef<Coupon>[] = [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <SortableHeader label="Code" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => <span className="font-mono font-medium">{row.original.code}</span>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => <Badge variant="secondary">{typeLabel(row.original.type)}</Badge>,
      enableSorting: false,
    },
    {
      accessorKey: "value",
      header: "Discount",
      cell: ({ row }) => <span className="text-muted-foreground">{formatValue(row.original)}</span>,
      enableSorting: false,
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => {
        const coupon = row.original;
        const expired = isExpired(coupon);
        if (expired) return <Badge variant="outline">Expired</Badge>;
        return <Badge variant={coupon.active ? "default" : "secondary"}>{coupon.active ? "Active" : "Inactive"}</Badge>;
      },
      enableSorting: false,
    },
    {
      accessorKey: "expiresAt",
      header: ({ column }) => (
        <SortableHeader label="Expires" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.expiresAt ? new Date(row.original.expiresAt).toLocaleDateString() : "Never"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const coupon = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="icon-xs" aria-label="Edit coupon" onClick={() => openEdit(coupon)}>
              <Pencil className="size-3" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="destructive" size="icon-xs" aria-label="Delete coupon" />}>
                <Trash2 className="size-3" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {coupon.code}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes the coupon. Orders that already used it are unaffected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(coupon.id)}>Delete coupon</AlertDialogAction>
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
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Coupon Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create, edit, and retire discount codes.</p>
        </div>
        <Button
          onClick={() => {
            setCreateDraft(emptyDraft());
            setCreateOpen(true);
          }}
          className="gap-1.5"
        >
          <Plus className="size-4" />
          Add coupon
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}
        </div>
      ) : coupons && coupons.length > 0 ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search by code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={statusFilter} onValueChange={(value) => value && setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DataTable
            columns={columns}
            data={filteredCoupons}
            emptyMessage="No coupons match your search."
            headClassName="h-12 px-4 text-sm"
            cellClassName="px-4 py-4"
          />
        </>
      ) : (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No coupons yet. Create one to offer discounts at checkout.
        </div>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setCreateDraft(emptyDraft());
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add coupon</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <CouponFields draft={createDraft} setDraft={setCreateDraft} idPrefix="create" />
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCoupon.isPending}>
                {createCoupon.isPending ? "Creating…" : "Add coupon"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editingCoupon !== null} onOpenChange={(open) => !open && setEditingCoupon(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit coupon</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <CouponFields draft={editDraft} setDraft={setEditDraft} idPrefix="edit" />
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setEditingCoupon(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateCoupon.isPending}>
                {updateCoupon.isPending ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function CouponFields({
  draft,
  setDraft,
  idPrefix,
}: {
  draft: CouponDraft;
  setDraft: (draft: CouponDraft) => void;
  idPrefix: string;
}) {
  return (
    <FieldGroup className="gap-4">
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-coupon-code`}>Code</FieldLabel>
        <Input
          id={`${idPrefix}-coupon-code`}
          value={draft.code}
          onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
          placeholder="e.g. SAVE10"
          required
        />
      </Field>
      <Field>
        <FieldLabel>Discount type</FieldLabel>
        <Select value={draft.type} onValueChange={(value) => value && setDraft({ ...draft, type: value as CouponType })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUPON_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      {draft.type !== "bogo" && (
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-coupon-value`}>
            {draft.type === "percentage" ? "Percentage off" : "Amount off ($)"}
          </FieldLabel>
          <Input
            id={`${idPrefix}-coupon-value`}
            type="number"
            min={0}
            max={draft.type === "percentage" ? 100 : undefined}
            step={draft.type === "percentage" ? 1 : 0.01}
            value={draft.value}
            onChange={(e) => setDraft({ ...draft, value: e.target.value })}
            required
          />
        </Field>
      )}
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-coupon-expires`}>Expires (optional)</FieldLabel>
        <Input
          id={`${idPrefix}-coupon-expires`}
          type="date"
          value={draft.expiresAt}
          onChange={(e) => setDraft({ ...draft, expiresAt: e.target.value })}
        />
      </Field>
      <Field orientation="horizontal" className="items-center justify-between">
        <FieldLabel htmlFor={`${idPrefix}-coupon-active`}>Active</FieldLabel>
        <Switch
          id={`${idPrefix}-coupon-active`}
          checked={draft.active}
          onCheckedChange={(checked) => setDraft({ ...draft, active: checked })}
        />
      </Field>
    </FieldGroup>
  );
}
