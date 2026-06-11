import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  const branchId = searchParams.get("branchId") || undefined;
  const cashierId = searchParams.get("cashierId") || undefined;

  const from = fromStr ? new Date(fromStr) : (() => {
    const d = new Date(); d.setUTCDate(d.getUTCDate() - 6); d.setUTCHours(0, 0, 0, 0); return d;
  })();
  const to = toStr
    ? (() => { const d = new Date(toStr); d.setUTCHours(23, 59, 59, 999); return d; })()
    : (() => { const d = new Date(); d.setUTCHours(23, 59, 59, 999); return d; })();

  const where = {
    createdAt: { gte: from, lte: to },
    status: "COMPLETED" as const,
    ...(branchId ? { branchId } : {}),
    ...(cashierId ? { cashierId } : {}),
  };

  const [transactions, byBranch, byCashier, topItems, branches, cashiers] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        branch: { select: { name: true } },
        cashier: { select: { name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),

    prisma.transaction.groupBy({
      by: ["branchId"],
      where,
      _sum: { total: true },
      _count: { id: true },
    }),

    prisma.transaction.groupBy({
      by: ["cashierId"],
      where,
      _sum: { total: true },
      _count: { id: true },
    }),

    prisma.transactionItem.groupBy({
      by: ["menuName"],
      where: { transaction: where },
      _sum: { qty: true, lineTotal: true },
      orderBy: { _sum: { qty: "desc" } },
      take: 10,
    }),

    prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),

    prisma.user.findMany({
      where: { role: "CASHIER", isActive: true },
      select: { id: true, name: true, branchId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Enrich byBranch with branch name
  const branchMap = new Map(branches.map((b) => [b.id, b.name]));
  const branchSummary = byBranch.map((b) => ({
    branchId: b.branchId,
    branchName: (b.branchId ? branchMap.get(b.branchId) : undefined) ?? b.branchId ?? "—",
    totalSales: Number(b._sum.total ?? 0),
    txCount: b._count.id,
  }));

  // Enrich byCashier
  const cashierMap = new Map(cashiers.map((c) => [c.id, c.name]));
  const cashierSummary = byCashier.map((c) => ({
    cashierId: c.cashierId,
    cashierName: (c.cashierId ? cashierMap.get(c.cashierId) : undefined) ?? c.cashierId ?? "—",
    totalSales: Number(c._sum.total ?? 0),
    txCount: c._count.id,
  }));

  const totalSales = transactions.reduce((s, t) => s + Number(t.total), 0);

  // Daily trend: group by date
  const dailyMap = new Map<string, { date: string; total: number; count: number }>();
  for (const tx of transactions) {
    const key = tx.createdAt.toISOString().slice(0, 10);
    const existing = dailyMap.get(key) ?? { date: key, total: 0, count: 0 };
    existing.total += Number(tx.total);
    existing.count += 1;
    dailyMap.set(key, existing);
  }
  const dailyTrend = Array.from(dailyMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return NextResponse.json({
    totalSales,
    txCount: transactions.length,
    branchSummary,
    cashierSummary,
    topItems: topItems.map((i) => ({
      menuName: i.menuName,
      qty: i._sum.qty ?? 0,
      total: Number(i._sum.lineTotal ?? 0),
    })),
    dailyTrend,
    transactions: transactions.map((t) => ({
      id: t.id,
      code: t.code,
      branchName: t.branch?.name ?? "—",
      cashierName: t.cashier?.name ?? "—",
      total: Number(t.total),
      discount: Number(t.discount),
      paidAmount: Number(t.paidAmount),
      createdAt: t.createdAt,
      itemCount: t.items.reduce((s, i) => s + i.qty, 0),
    })),
    branches,
    cashiers,
  });
}
