"use client";

import Link from "next/link";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useAllOrders } from "@/lib/query/orders";
import type { Order, OrderStatus } from "@/lib/db/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const ORDER_STATUSES: OrderStatus[] = [
  "placed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refund_requested",
  "refunded",
  "partially_refunded",
];

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "refunded" || status === "partially_refunded") return "secondary";
  if (status === "cancelled" || status === "refund_requested") return "outline";
  return "default";
}

function SortableHeader({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" className="-ml-3 h-8" onClick={onClick}>
      {label}
      <ArrowUpDown className="size-3.5" />
    </Button>
  );
}

const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "id",
    header: "Order",
    cell: ({ row }) => <span className="font-medium">#{row.original.id.slice(0, 8)}</span>,
  },
  {
    accessorKey: "userEmail",
    header: "Customer",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{row.original.userEmail || "Unknown"}</span>
        {row.original.archived && (
          <Badge variant="outline" className="shrink-0">
            Account deleted
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <SortableHeader
        label="Date"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <span className="block w-24 overflow-hidden whitespace-nowrap text-muted-foreground">
        {new Date(row.original.createdAt).toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <SortableHeader
        label="Status"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <Badge variant={statusVariant(row.original.status)} className="capitalize">
        {row.original.status.replace("_", " ")}
      </Badge>
    ),
  },
  {
    accessorKey: "items",
    header: "Items",
    cell: ({ row }) => {
      const count = row.original.items.reduce((sum, item) => sum + item.quantity, 0);
      return <span className="text-muted-foreground">{count} item{count === 1 ? "" : "s"}</span>;
    },
    enableSorting: false,
  },
  {
    accessorKey: "totalCents",
    header: ({ column }) => (
      <div className="text-right">
        <SortableHeader
          label="Total"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      </div>
    ),
    cell: ({ row }) => <div className="text-right font-semibold">{formatPrice(row.original.totalCents)}</div>,
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="text-right">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={`/admin/orders/${row.original.id}`} />}
        >
          View details
        </Button>
      </div>
    ),
  },
];

export default function AdminOrdersPage() {
  const { data: orders, isLoading } = useAllOrders();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Order["status"]>("all");

  const filteredOrders = (orders ?? []).filter((order) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = term
      ? order.id.toLowerCase().includes(term) || (order.userEmail ?? "").toLowerCase().includes(term)
      : true;
    const matchesStatus = statusFilter === "all" ? true : order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Order Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every order placed across all customers.
        </p>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Card key={index}>
              <CardContent className="py-6">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="mt-3 h-4 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : orders && orders.length > 0 ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search by order # or customer email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => value && setStatusFilter(value as "all" | OrderStatus)}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status} className="capitalize">
                    {status.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DataTable
            columns={columns}
            data={filteredOrders}
            emptyMessage="No orders match your search."
            headClassName="h-12 px-4 text-sm"
            cellClassName="px-4 py-4"
          />
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No orders yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Orders placed on the storefront will show up here.
          </CardContent>
        </Card>
      )}
    </main>
  );
}
