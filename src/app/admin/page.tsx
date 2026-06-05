import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRp } from "@/lib/format";
import Link from "next/link";
import { TrendAreaChart, BranchBarChart } from "./_components/dashboard-chart";

export default async function AdminDashboard() {
  await getServerSession(authOptions);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

  const [branches, salesByBranch, salesByCashier, stocks, topItems, trendTxs] =
    await Promise.all([
      prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),

      prisma.transaction.groupBy({
        by: ["branchId"],
        where: { createdAt: { gte: today, lt: tomorrow }, status: "COMPLETED" },
        _sum: { total: true },
        _count: { id: true },
      }),

      prisma.transaction.groupBy({
        by: ["cashierId"],
        where: { createdAt: { gte: today, lt: tomorrow }, status: "COMPLETED" },
        _sum: { total: true },
        _count: { id: true },
      }),

      prisma.dailyStock.findMany({
        where: { date: today },
        include: {
          menuItem: { select: { name: true } },
          branch: { select: { id: true, name: true } },
        },
        orderBy: { remainingQty: "asc" },
      }),

      prisma.transactionItem.groupBy({
        by: ["menuName"],
        where: {
          transaction: { createdAt: { gte: today, lt: tomorrow }, status: "COMPLETED" },
        },
        _sum: { qty: true, lineTotal: true },
        orderBy: { _sum: { qty: "desc" } },
        take: 5,
      }),

      // 7-day trend
      prisma.transaction.findMany({
        where: { createdAt: { gte: sevenDaysAgo, lt: tomorrow }, status: "COMPLETED" },
        select: { createdAt: true, total: true },
      }),
    ]);

  // Build 7-day trend with zero fill
  const trendMap = new Map<string, number>();
  for (const tx of trendTxs) {
    const key = tx.createdAt.toISOString().slice(0, 10);
    trendMap.set(key, (trendMap.get(key) ?? 0) + Number(tx.total));
  }
  const trend7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    const [, mm, dd] = key.split("-");
    return { date: `${mm}/${dd}`, total: trendMap.get(key) ?? 0, count: 0 };
  });

  const totalSales = salesByBranch.reduce((s, b) => s + Number(b._sum.total ?? 0), 0);
  const totalTx = salesByBranch.reduce((s, b) => s + b._count.id, 0);
  const avgTx = totalTx > 0 ? Math.round(totalSales / totalTx) : 0;

  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  const branchData = branches.map((branch) => {
    const sale = salesByBranch.find((s) => s.branchId === branch.id);
    const branchStocks = stocks.filter((s) => s.branch.id === branch.id);
    return {
      ...branch,
      totalSales: Number(sale?._sum.total ?? 0),
      txCount: sale?._count.id ?? 0,
      habisCount: branchStocks.filter((s) => s.remainingQty === 0).length,
      stockItems: branchStocks,
    };
  });

  const cashierUsers = await prisma.user.findMany({
    where: { role: "CASHIER", isActive: true },
    select: { id: true, name: true, branchId: true },
  });
  const cashierData = salesByCashier
    .map((c) => {
      const user = cashierUsers.find((u) => u.id === c.cashierId);
      return {
        cashierId: c.cashierId,
        name: user?.name ?? "—",
        branchName: user?.branchId ? (branchMap.get(user.branchId) ?? "—") : "—",
        totalSales: Number(c._sum.total ?? 0),
        txCount: c._count.id,
      };
    })
    .sort((a, b) => b.totalSales - a.totalSales);

  const branchChartData = branchData
    .filter((b) => b.totalSales > 0)
    .sort((a, b) => b.totalSales - a.totalSales)
    .map((b) => ({ name: b.name, total: b.totalSales }));

  const habisTotal = stocks.filter((s) => s.remainingQty === 0).length;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-gray-900 text-lg">Dashboard</h1>
        <span className="text-xs text-gray-400">
          {today.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900 text-white rounded-2xl p-4">
          <p className="text-xs text-gray-400">Penjualan Hari Ini</p>
          <p className="font-bold text-xl mt-1">{formatRp(totalSales)}</p>
          <p className="text-xs text-gray-400 mt-1">{branches.length} cabang aktif</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400">Total Transaksi</p>
          <p className="font-bold text-gray-900 text-xl mt-1">{totalTx}</p>
          <p className="text-xs text-gray-400 mt-1">rata-rata {formatRp(avgTx)}</p>
        </div>
      </div>

      {/* Alert stok habis */}
      {habisTotal > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-red-600 font-medium">
            {habisTotal} menu habis hari ini
          </p>
          <Link href="/admin/stock" className="text-xs text-red-500 font-semibold">
            Atur stok →
          </Link>
        </div>
      )}

      {/* 7-Day Trend */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 text-sm">Tren 7 Hari</h2>
          <Link href="/admin/reports" className="text-xs text-blue-600">Laporan lengkap →</Link>
        </div>
        <TrendAreaChart data={trend7} />
      </div>

      {/* Per Branch — list + bar chart */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <p className="px-4 py-3 text-sm font-semibold text-gray-900 border-b border-gray-100">
          Per Cabang
        </p>
        {branchData.length === 0 && (
          <p className="px-4 py-6 text-xs text-gray-400 text-center">Belum ada cabang aktif</p>
        )}
        {branchData.map((branch) => (
          <div key={branch.id} className="px-4 py-3 border-b border-gray-50 last:border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-sm">{branch.name}</p>
                <p className="text-xs text-gray-400">{branch.txCount} transaksi</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{formatRp(branch.totalSales)}</p>
                {branch.habisCount > 0 && (
                  <p className="text-xs text-red-500">{branch.habisCount} menu habis</p>
                )}
              </div>
            </div>
            {totalSales > 0 && (
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 rounded-full transition-all"
                  style={{ width: `${Math.round((branch.totalSales / totalSales) * 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}
        {branchChartData.length >= 2 && (
          <div className="px-4 py-3 border-t border-gray-50">
            <BranchBarChart data={branchChartData} />
          </div>
        )}
      </div>

      {/* Per Cashier */}
      {cashierData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="px-4 py-3 text-sm font-semibold text-gray-900 border-b border-gray-100">
            Performa Karyawan Hari Ini
          </p>
          {cashierData.map((c, i) => (
            <div key={c.cashierId} className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0">
              <span className="text-xs font-bold text-gray-300 w-5 text-center">{i + 1}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-400">{c.branchName} · {c.txCount} transaksi</p>
              </div>
              <p className="font-bold text-gray-900 text-sm">{formatRp(c.totalSales)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Stock Overview real-time */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">Sisa Stok Real-time</h2>
          <Link href="/admin/stock" className="text-xs text-blue-600">Atur stok →</Link>
        </div>
        {stocks.length === 0 && (
          <p className="px-4 py-6 text-xs text-gray-400 text-center">Stok hari ini belum diatur</p>
        )}
        {branchData.map(({ id, name, stockItems }) => (
          <div key={id} className="border-b border-gray-50 last:border-0">
            <p className="px-4 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">{name}</p>
            {stockItems.length === 0 ? (
              <p className="px-4 py-2 text-xs text-gray-400">Belum diatur</p>
            ) : (
              stockItems.map((s) => (
                <div key={s.id} className="px-4 py-2 flex items-center gap-2 border-b border-gray-50 last:border-0">
                  <p className="flex-1 text-sm text-gray-700">{s.menuItem.name}</p>
                  {/* progress bar */}
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        s.remainingQty === 0 ? "bg-red-400" :
                        s.remainingQty <= 5 ? "bg-amber-400" : "bg-emerald-400"
                      }`}
                      style={{
                        width: s.initialQty > 0
                          ? `${Math.min(100, (s.remainingQty / s.initialQty) * 100)}%`
                          : "0%",
                      }}
                    />
                  </div>
                  {s.remainingQty === 0 ? (
                    <span className="text-xs font-semibold text-red-500 w-12 text-right">Habis</span>
                  ) : (
                    <span className={`text-xs font-semibold w-12 text-right ${
                      s.remainingQty <= 5 ? "text-amber-600" : "text-emerald-600"
                    }`}>
                      Sisa {s.remainingQty}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        ))}
      </div>

      {/* Top items */}
      {topItems.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="px-4 py-3 text-sm font-semibold text-gray-900 border-b border-gray-100">
            Menu Terlaris Hari Ini
          </p>
          {topItems.map((item, i) => (
            <div key={item.menuName} className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0">
              <span className="text-xs font-bold text-gray-300 w-5 text-center">{i + 1}</span>
              <p className="flex-1 text-sm text-gray-900">{item.menuName}</p>
              <p className="text-xs text-gray-400">{item._sum.qty} porsi</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatRp(Number(item._sum.lineTotal ?? 0))}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
