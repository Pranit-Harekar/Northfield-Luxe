"use client";

import { use } from "react";
import { OrderDetailView } from "@/components/order-detail-view";

export default function AdminOrderDetailPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = use(params);
  return (
    <OrderDetailView
      orderId={id}
      rootLabel="Admin"
      rootHref="/admin/products"
      listLabel="Orders"
      listHref="/admin/orders"
      showCustomer
    />
  );
}
