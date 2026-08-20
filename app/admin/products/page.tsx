"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCategories, useProducts } from "@/lib/query/products";
import { useCreateProduct, useDeleteProduct } from "@/lib/query/adminProducts";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdminProductsPage() {
  const { data, isLoading } = useProducts({ pageSize: 50 });
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();
  const [name, setName] = useState("");
  const [priceDollars, setPriceDollars] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const leafCategories = categories?.filter((c) => c.parentId !== null) ?? [];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !priceDollars || !categoryId) return;
    const basePriceCents = Math.round(parseFloat(priceDollars) * 100);
    await createProduct.mutateAsync({
      name,
      description: `${name} — added via Admin Portal.`,
      categoryId,
      basePriceCents,
      images: [GENERIC_PRODUCT_IMAGE],
      variants: [{ id: crypto.randomUUID(), sku: `SKU-${Date.now()}`, label: "Standard", priceCents: basePriceCents, stock: 25 }],
      rating: 0,
      reviewCount: 0,
    });
    toast.success("Product created");
    setName("");
    setPriceDollars("");
    setCategoryId("");
  }

  async function handleDelete(productId: string) {
    await deleteProduct.mutateAsync(productId);
    toast.success("Product deleted");
  }

  return (
    <main className="mx-auto max-w-5xl flex-1 px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold">Product Management</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate}>
            <FieldGroup className="gap-4 md:grid md:grid-cols-[1fr,160px,220px,auto] md:items-end">
              <Field>
                <FieldLabel htmlFor="admin-product-name">Name</FieldLabel>
                <Input
                  id="admin-product-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="admin-product-price">Price (USD)</FieldLabel>
                <Input
                  id="admin-product-price"
                  value={priceDollars}
                  onChange={(e) => setPriceDollars(e.target.value)}
                  type="number"
                  step="0.01"
                />
              </Field>
              <Field>
                <FieldLabel>Category</FieldLabel>
                <Select value={categoryId || "placeholder"} onValueChange={(value) => setCategoryId(value && value !== "placeholder" ? value : "")}>
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
              <Button type="submit" disabled={createProduct.isPending} className="md:self-end">
                {createProduct.isPending ? "Creating…" : "Add product"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}
            </div>
          ) : (
            <table
              // Intentional bug (Category A / admin-table-overflow): the product
              // table now has a fixed minimum width without a scrolling wrapper,
              // so the admin page overflows horizontally on smaller viewports.
              className="min-w-[900px] text-left text-sm"
            >
              <TableHeader className="text-xs uppercase text-muted-foreground">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Variants</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{formatPrice(product.basePriceCents)}</TableCell>
                    <TableCell>{product.variants.length}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button variant="destructive" size="xs" className="ml-auto" />
                          }
                        >
                          <Trash2 className="size-3" />
                          Delete
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
                            <AlertDialogAction onClick={() => handleDelete(product.id)}>
                              Delete product
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
