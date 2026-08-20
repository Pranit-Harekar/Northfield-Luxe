"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useCategories, useProducts } from "@/lib/query/products";
import { useAddToCart } from "@/lib/query/cart";
import { useSession } from "@/lib/hooks/useSession";
import { isStaffRole } from "@/lib/auth/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductImage } from "@/components/product-image";
import Footer from "./footer";

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function ProductSkeleton() {
  return (
    <Card className="overflow-hidden py-0">
      <Skeleton className="aspect-square w-full rounded-none" />
      <CardHeader className="gap-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full" />
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-24" />
      </CardFooter>
    </Card>
  );
}

export default function Home() {
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "price-asc" | "price-desc" | "rating">("newest");
  const [page, setPage] = useState(1);

  const { data: categories } = useCategories();
  const { data, isLoading } = useProducts({ categoryId, search: search || undefined, sort, page, pageSize: 24 });
  const addToCart = useAddToCart();
  const session = useSession();
  const staff = isStaffRole(session?.role);

  const parentCategories = categories?.filter((c) => c.parentId === null) ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  async function handleAddToCart(productId: string, variantId: string) {
    try {
      await addToCart.mutateAsync({ productId, variantId, quantity: 1 });
      toast.success("Added to cart");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add to cart");
    }
  }

  return (
    <>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="mb-6 flex flex-nowrap items-center gap-3 overflow-x-auto">
        <Input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          // Intentional bug (Category A / home-filter-overflow): the search
          // toolbar is forced onto one row with oversized controls, so it
          // overflows horizontally on small screens instead of wrapping.
          className="min-w-60"
        />
        <Select
          value={categoryId ?? "all"}
          onValueChange={(value) => {
            setCategoryId(value && value !== "all" ? value : undefined);
            setPage(1);
          }}
        >
          <SelectTrigger className="min-w-44">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {parentCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sort}
          onValueChange={(value) => {
            if (value) {
              setSort(value as typeof sort);
              setPage(1);
            }
          }}
        >
          <SelectTrigger className="min-w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="rating">Top Rated</SelectItem>
          </SelectContent>
        </Select>
        {data && <Badge variant="outline" className="ml-auto">{data.total} products</Badge>}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => <ProductSkeleton key={index} />)}
        </div>
      ) : data?.items.length ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.items.map((product) => {
              const firstVariant = product.variants[0];
              const totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
              return (
                <Card key={product.id} className="overflow-hidden py-0">
                  <Link href={`/products/${product.id}`} className="block overflow-hidden">
                    <ProductImage src={product.images[0]} alt={product.name} className="aspect-square w-full object-cover" />
                  </Link>
                  <CardHeader className="gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="line-clamp-2">
                        <Link href={`/products/${product.id}`} className="hover:underline">
                          {product.name}
                        </Link>
                      </CardTitle>
                      <Badge variant="secondary">★ {product.rating}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{product.reviewCount} reviews</span>
                      <Badge variant={totalStock > 0 ? "outline" : "destructive"}>
                        {totalStock > 0 ? `${totalStock} in stock` : "Sold out"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
                  </CardContent>
                  <CardFooter className="justify-between gap-3">
                    <span className="text-base font-semibold">{formatPrice(product.basePriceCents)}</span>
                    {!staff && (
                      <Button size="sm" onClick={() => handleAddToCart(product.id, firstVariant.id)}>
                        Add to cart
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          {totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Badge variant="outline">Page {page} of {totalPages}</Badge>
                </PaginationItem>
                <PaginationItem>
                  <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>
                    Next
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No products matched your filters.
          </CardContent>
        </Card>
      )}
      </main>
      <Footer />
    </>
  );
}
