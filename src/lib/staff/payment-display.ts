export function actualPaymentLabel(rows: { method: string; status: string | null; amount: number | string }[], total?: number | string): string | null {
  const labels: Record<string, string> = { clover: "Clover", clover_card: "Clover", wave: "Wave", etransfer: "e-Transfer", cash: "cash", cheque: "cheque", credit: "credit" };
  const methods = [...new Set(rows.filter(r => r.status === "recorded" && Number(r.amount) > 0).map(r => labels[r.method] ?? "other recorded method"))];
  const paid = rows.filter(r => r.status === "recorded").reduce((sum, r) => sum + Number(r.amount), 0);
  const prefix = total !== undefined && Math.round(paid * 100) < Math.round(Number(total) * 100) ? "Partial payment via" : "Paid via";
  return methods.length ? `${prefix} ${methods.join(" + ")}` : null;
}
