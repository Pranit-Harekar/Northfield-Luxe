"use client";

import { use } from "react";
import { OrderDetailView } from "@/components/order-detail-view";

export default function OrderDetailPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = use(params);
  return <OrderDetailView orderId={id} rootLabel="Shop" rootHref="/" listLabel="Orders" listHref="/orders" />;
}
