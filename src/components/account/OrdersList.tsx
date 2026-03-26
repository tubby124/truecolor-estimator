"use client";

import Link from "next/link";
import type { Order } from "./types";
import { OrderCard } from "./OrderCard";

interface OrdersListProps {
  orders: Order[];
  ordersLoading: boolean;
  expandedOrder: string | null;
  setExpandedOrder: (id: string | null) => void;
  uploadingFile: string | null;
  uploadDone: Set<string>;
  uploadError: string | null;
  reorderedId: string | null;
  onReorder: (order: Order) => void;
  onFileUpload: (orderId: string, file: File) => void;
  onReceiptClick: (order: Order) => void;
}

export function OrdersList({ orders, ordersLoading, expandedOrder, setExpandedOrder, uploadingFile, uploadDone, uploadError, reorderedId, onReorder, onFileUpload, onReceiptClick }: OrdersListProps) {
  if (ordersLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-lg mb-6">No orders yet.</p>
        <Link
          href="/products"
          className="bg-[#16C2F3] text-white font-bold px-8 py-4 rounded-lg hover:bg-[#0fb0dd] transition-colors"
        >
          Get a price &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          expandedOrder={expandedOrder}
          setExpandedOrder={setExpandedOrder}
          uploadingFile={uploadingFile}
          uploadDone={uploadDone}
          uploadError={uploadError}
          reorderedId={reorderedId}
          onReorder={onReorder}
          onFileUpload={onFileUpload}
          onReceiptClick={onReceiptClick}
        />
      ))}
    </div>
  );
}
