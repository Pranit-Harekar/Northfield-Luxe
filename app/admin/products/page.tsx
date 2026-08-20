"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/db/types";
import { useCategories, useProducts } from "@/lib/query/products";
import { useCreateProduct, useDeleteProduct, useUpdateProduct } from "@/lib/query/adminProducts";
import { GENERIC_PRODUCT_IMAGE } from "@/lib/db/seed";
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
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/data-table";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

interface VariantDraft {
  id?: string;
  sku?: string;
  label: string;
  priceDollars: string;
  stock: string;
}

function makeVariantDraft(label = ""): VariantDraft {
  return { label, priceDollars: "", stock: "25" };
}

function variantDraftFromExisting(variant: { id: string; sku: string; label: string; priceCents: number; stock: number }): VariantDraft {
  return {
    id: variant.id,
    sku: variant.sku,
    label: variant.label,
    priceDollars: (variant.priceCents / 100).toFixed(2),
    stock: String(variant.stock),
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

export default function AdminProductsPage() {
  const { data, isLoading } = useProducts({ pageSize: 50 });
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [priceDollars, setPriceDollars] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>([makeVariantDraft("Standard")]);

  function addVariantDraft() {
    setVariantDrafts((prev) => [...prev, makeVariantDraft()]);
  }

  function removeVariantDraft(index: number) {
    setVariantDrafts((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function updateVariantDraft(index: number, patch: Partial<VariantDraft>) {
    setVariantDrafts((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function resetCreateForm() {
    setName("");
    setPriceDollars("");
    setCategoryId("");
    setVariantDrafts([makeVariantDraft("Standard")]);
  }

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriceDollars, setEditPriceDollars] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editVariantDrafts, setEditVariantDrafts] = useState<VariantDraft[]>([makeVariantDraft("Standard")]);

  function addEditVariantDraft() {
    setEditVariantDrafts((prev) => [...prev, makeVariantDraft()]);
  }

  function removeEditVariantDraft(index: number) {
    setEditVariantDrafts((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function updateEditVariantDraft(index: number, patch: Partial<VariantDraft>) {
    setEditVariantDrafts((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  const leafCategories = categories?.filter((c) => c.parentId !== null) ?? [];

  const filteredProducts = (data?.items ?? []).filter((product) => {
    const matchesSearch = search.trim()
      ? product.name.toLowerCase().includes(search.trim().toLowerCase())
      : true;
    const matchesCategory = categoryFilter === "all" ? true : product.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !priceDollars || !categoryId) return;
    const basePriceCents = Math.round(parseFloat(priceDollars) * 100);
    const variants = variantDrafts.map((v, index) => {
      const priceCents = v.priceDollars ? Math.round(parseFloat(v.priceDollars) * 100) : basePriceCents;
      const stock = v.stock ? parseInt(v.stock, 10) : 0;
      return {
        id: crypto.randomUUID(),
        sku: `SKU-${Date.now()}-${index}`,
        label: v.label.trim() || "Standard",
        priceCents: Number.isFinite(priceCents) ? priceCents : basePriceCents,
        stock: Number.isFinite(stock) ? stock : 0,
      };
    });
    await createProduct.mutateAsync({
      name,
      description: `${name} — added via Admin Portal.`,
      categoryId,
      basePriceCents,
      images: [GENERIC_PRODUCT_IMAGE],
      variants,
      rating: 0,
      reviewCount: 0,
    });
    toast.success("Product created");
    resetCreateForm();
    setCreateOpen(false);
  }

  async function handleDelete(productId: string) {
    await deleteProduct.mutateAsync(productId);
    toast.success("Product deleted");
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setEditName(product.name);
    setEditDescription(product.description);
    setEditPriceDollars((product.basePriceCents / 100).toFixed(2));
    setEditCategoryId(product.categoryId);
    setEditVariantDrafts(
      product.variants.length > 0
        ? product.variants.map(variantDraftFromExisting)
        : [makeVariantDraft("Standard")],
    );
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProduct || !editName || !editPriceDollars || !editCategoryId) return;
    const basePriceCents = Math.round(parseFloat(editPriceDollars) * 100);
    const variants = editVariantDrafts.map((v, index) => {
      const priceCents = v.priceDollars ? Math.round(parseFloat(v.priceDollars) * 100) : basePriceCents;
      const stock = v.stock ? parseInt(v.stock, 10) : 0;
      return {
        // Keep the existing id/sku for variants that already existed so
        // in-flight carts and past order references stay meaningful; only
        // newly added rows get a freshly generated id/sku.
        id: v.id ?? crypto.randomUUID(),
        sku: v.sku ?? `SKU-${Date.now()}-${index}`,
        label: v.label.trim() || "Standard",
        priceCents: Number.isFinite(priceCents) ? priceCents : basePriceCents,
        stock: Number.isFinite(stock) ? stock : 0,
      };
    });
    await updateProduct.mutateAsync({
      id: editingProduct.id,
      patch: {
        name: editName,
        description: editDescription,
        categoryId: editCategoryId,
        basePriceCents,
        variants,
      },
    });
    toast.success("Product updated");
    setEditingProduct(null);
  }

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader label="Name" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "basePriceCents",
      header: ({ column }) => (
        <SortableHeader label="Price" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
      ),
      cell: ({ row }) => <span className="text-muted-foreground">{formatPrice(row.original.basePriceCents)}</span>,
    },
    {
      accessorKey: "variants",
      header: "Variants",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.variants.length}</span>,
      enableSorting: false,
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="icon-xs" aria-label="Edit product" onClick={() => openEdit(product)}>
              <Pencil className="size-3" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="destructive" size="icon-xs" aria-label="Delete product" />}>
                <Trash2 className="size-3" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {product.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action removes the product from the mock catalog immediately.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(product.id)}>Delete product</AlertDialogAction>
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
          <h1 className="text-2xl font-semibold">Product Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create, edit, and delete catalog products.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="size-4" />
          Add product
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={categoryFilter} onValueChange={(value) => value && setCategoryFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {leafCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DataTable
            columns={columns}
            data={filteredProducts}
            emptyMessage="No products match your search."
            headClassName="h-12 px-4 text-sm"
            cellClassName="px-4 py-4"
          />
        </>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="admin-product-name">Name</FieldLabel>
                <Input id="admin-product-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="admin-product-price">Price (USD)</FieldLabel>
                <Input
                  id="admin-product-price"
                  value={priceDollars}
                  onChange={(e) => setPriceDollars(e.target.value)}
                  type="number"
                  step="0.01"
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Category</FieldLabel>
                <Select
                  value={categoryId || "placeholder"}
                  onValueChange={(value) => setCategoryId(value && value !== "placeholder" ? value : "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder">Select…</SelectItem>
                    {leafCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel>Variants</FieldLabel>
                  <Button type="button" variant="outline" size="xs" className="gap-1" onClick={addVariantDraft}>
                    <Plus className="size-3" />
                    Add variant
                  </Button>
                </div>
                <div className="space-y-2">
                  {variantDrafts.map((variant, index) => (
                    <div key={index} className="flex items-end gap-2">
                      <Field className="flex-1">
                        {index === 0 && <FieldLabel className="text-xs text-muted-foreground">Label</FieldLabel>}
                        <Input
                          placeholder="e.g. Size M / Black"
                          value={variant.label}
                          onChange={(e) => updateVariantDraft(index, { label: e.target.value })}
                        />
                      </Field>
                      <Field className="w-28">
                        {index === 0 && (
                          <FieldLabel className="text-xs text-muted-foreground">Price (USD)</FieldLabel>
                        )}
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={priceDollars || "0.00"}
                          value={variant.priceDollars}
                          onChange={(e) => updateVariantDraft(index, { priceDollars: e.target.value })}
                        />
                      </Field>
                      <Field className="w-20">
                        {index === 0 && <FieldLabel className="text-xs text-muted-foreground">Stock</FieldLabel>}
                        <Input
                          type="number"
                          value={variant.stock}
                          onChange={(e) => updateVariantDraft(index, { stock: e.target.value })}
                        />
                      </Field>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-xs"
                        aria-label="Remove variant"
                        disabled={variantDrafts.length === 1}
                        onClick={() => removeVariantDraft(index)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave a variant&apos;s price blank to use the base price above.
                </p>
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateOpen(false);
                  resetCreateForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createProduct.isPending}>
                {createProduct.isPending ? "Creating…" : "Add product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editingProduct !== null} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="edit-product-name">Name</FieldLabel>
                <Input
                  id="edit-product-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-product-description">Description</FieldLabel>
                <Textarea
                  id="edit-product-description"
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="edit-product-price">Price (USD)</FieldLabel>
                  <Input
                    id="edit-product-price"
                    value={editPriceDollars}
                    onChange={(e) => setEditPriceDollars(e.target.value)}
                    type="number"
                    step="0.01"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel>Category</FieldLabel>
                  <Select value={editCategoryId || "placeholder"} onValueChange={(value) => setEditCategoryId(value && value !== "placeholder" ? value : "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder">Select…</SelectItem>
                      {leafCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel>Variants</FieldLabel>
                  <Button type="button" variant="outline" size="xs" className="gap-1" onClick={addEditVariantDraft}>
                    <Plus className="size-3" />
                    Add variant
                  </Button>
                </div>
                <div className="space-y-2">
                  {editVariantDrafts.map((variant, index) => (
                    <div key={variant.id ?? `new-${index}`} className="flex items-end gap-2">
                      <Field className="flex-1">
                        {index === 0 && <FieldLabel className="text-xs text-muted-foreground">Label</FieldLabel>}
                        <Input
                          placeholder="e.g. Size M / Black"
                          value={variant.label}
                          onChange={(e) => updateEditVariantDraft(index, { label: e.target.value })}
                        />
                      </Field>
                      <Field className="w-28">
                        {index === 0 && (
                          <FieldLabel className="text-xs text-muted-foreground">Price (USD)</FieldLabel>
                        )}
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={editPriceDollars || "0.00"}
                          value={variant.priceDollars}
                          onChange={(e) => updateEditVariantDraft(index, { priceDollars: e.target.value })}
                        />
                      </Field>
                      <Field className="w-20">
                        {index === 0 && <FieldLabel className="text-xs text-muted-foreground">Stock</FieldLabel>}
                        <Input
                          type="number"
                          value={variant.stock}
                          onChange={(e) => updateEditVariantDraft(index, { stock: e.target.value })}
                        />
                      </Field>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-xs"
                        aria-label="Remove variant"
                        disabled={editVariantDrafts.length === 1}
                        onClick={() => removeEditVariantDraft(index)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave a variant&apos;s price blank to use the base price above. Removing a variant here only
                  affects new purchases — it does not change any past orders.
                </p>
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateProduct.isPending}>
                {updateProduct.isPending ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
