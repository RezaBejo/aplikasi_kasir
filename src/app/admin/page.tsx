import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRp } from "@/lib/format";
import Link from "next/link";

export default async function AdminDashboard() {
  await getServerSession(authOptions); // session already validated by layout

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const [branches, salesByBranch, stocks, topItems] = await Promise.all([
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),

    prisma.transaction.groupBy({
      by: ["branchId"],
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
  ]);

  const totalSales = salesByBranch.reduce((s, b) => s + Number(b._sum.total ?? 0), 0);
  const totalTx = salesByBranch.reduce((s, b) => s + b._count.id, 0);

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

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4 pb-8">
      <h1 className="font-bold text-gray-900 text-lg">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400">Penjualan Hari Ini</p>
          <p className="font-bold text-gray-900 text-xl mt-1">{formatRp(totalSales)}</p>
          <p className="text-xs text-gray-400 mt-1">{branches.length} cabang aktif</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-gray-400">Total Transaksi</p>
          <p className="font-bold text-gray-900 text-xl mt-1">{totalTx}</p>
          <p className="text-xs text-gray-400 mt-1">hari ini</p>
        </div>
      </div>

      {/* Per Branch */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">Per Cabang</h2>
          <Link href="/admin/reports" className="text-xs text-blue-600">
            Lihat laporan →
          </Link>
        </div>
        {branchData.length === 0 && (
          <p className="px-4 py-6 text-xs text-gray-400 text-center">
            Belum ada cabang aktif
          </p>
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
            {/* Mini progress bar */}
            {totalSales > 0 && (
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-900 rounded-full"
                  style={{ width: `${Math.round((branch.totalSales / totalSales) * 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Stock Overview */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">Stok Real-time</h2>
          <Link href="/admin/stock" className="text-xs text-blue-600">
            Atur stok →
          </Link>
        </div>
        {branchData.map(({ id, name, stockItems }) => (
          <div key={id} className="border-b border-gray-50 last:border-0">
            <p className="px-4 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
              {name}
            </p>
            {stockItems.length === 0 ? (
              <p className="px-4 py-3 text-xs text-gray-400">Stok belum diatur hari ini</p>
            ) : (
              stockItems.map((s) => (
                <div
                  key={s.id}
                  className="px-4 py-2 flex items-center justify-between border-b border-gray-50 last:border-0"
                >
                  <p className="text-sm text-gray-700">{s.menuItem.name}</p>
                  {s.remainingQty === 0 ? (
                    <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                      Habis
                    </span>
                  ) : (
                    <span
                      className={`text-xs font-medium ${
                        s.remainingQty <= 5 ? "text-amber-600" : "text-emerald-600"
                      }`}
                    >
                      Sisa {s.remainingQty}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        ))}
        {stocks.length === 0 && (
          <p className="px-4 py-6 text-xs text-gray-400 text-center">
            Stok hari ini belum diatur
          </p>
        )}
      </div>

      {/* Top items */}
      {topItems.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Menu Terlaris Hari Ini</h2>
          </div>
          {topItems.map((item, i) => (
            <div
              key={item.menuName}
              className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0"
            >
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
