import type { LineItem } from "@/lib/cart/cart";

export interface OrderItem {
  id: string;
  product_name: string;
  qty: number;
  width_in: number | null;
  height_in: number | null;
  sides: number;
  design_status: string;
  line_total: number;
  category: string;
  material_code: string | null;
  addons: string[] | null;
  line_items_json: LineItem[] | null;
  file_storage_path: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  gst: number;
  pst: number | null;
  total: number;
  discount_code: string | null;
  discount_amount: number | null;
  notes: string | null;
  created_at: string;
  is_rush: boolean;
  payment_method: string;
  pay_url: string | null;
  proof_storage_path: string | null;
  proof_sent_at: string | null;
  file_storage_paths: string[] | null;
  order_items: OrderItem[];
}

export interface SessionData {
  access_token: string;
  user: { id: string; email?: string };
}

export interface QuoteRequest {
  id: string;
  created_at: string;
  items: { product: string; qty?: number; notes?: string }[];
  replied_at: string | null;
  staff_note: string | null;
  reply_body: string | null;
}

export interface CustomerProfile {
  name: string;
  phone: string;
  company: string;
  address: string;
}
