import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Prisma } from "@prisma/client";

function formatRp(amount: number | string | Prisma.Decimal): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const where: Prisma.TransactionWhereInput = {
    createdAt: { gte: today, lt: tomorrow },
    ...(session.user.branchId ? { branchId: session.user.branchId } : {}),
    ...(session.user.role === "CASHIER" ? { cashierId: session.user.id } : {}),
  };

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      items: true,
      cashier: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalSales = transactions.reduce((s, t) => s + Number(t.total), 0);
  const backHref = session.user.role === "OWNER" ? "/admin" : "/pos";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Link
          href={backHref}
          className="p-2 rounded-xl bg-gray-100 text-gray-600 active:bg-gray-200"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="font-bold text-gray-900">Riwayat Hari Ini</h1>
          <p className="text-xs text-gray-400">
            {transactions.length} transaksi · {formatRp(totalSales)}
          </p>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-3">
        {transactions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">Belum ada transaksi hari ini</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{tx.code}</p>
                  <p className="text-xs text-gray-400">
                    {formatTime(tx.createdAt)} · {tx.cashier?.name ?? "—"}
                  </p>
                </div>
                <p className="font-bold text-gray-900">{formatRp(tx.total)}</p>
              </div>

              {/* Items */}
              <div className="space-y-0.5 text-xs text-gray-500 border-t border-gray-100 pt-2 mt-2">
                {tx.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.menuName} ×{item.qty}
                    </span>
                    <span>{formatRp(item.lineTotal)}</span>
                  </div>
                ))}
              </div>

              {/* Discount + paid info */}
              {Number(tx.discount) > 0 && (
                <p className="text-xs text-emerald-600 mt-1.5">
                  Diskon: -{formatRp(tx.discount)}
                </p>
              )}
              <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                <span>Bayar {formatRp(tx.paidAmount)}</span>
                <span>Kembali {formatRp(tx.changeAmount)}</span>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
