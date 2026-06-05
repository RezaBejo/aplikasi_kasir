"use client";

import { useState, useEffect, useCallback } from "react";
import { formatRp, formatDate, formatTime, toInputDate } from "@/lib/format";
import { Search } from "lucide-react";

type Branch = { id: string; name: string };
type Cashier = { id: string; name: string };
type Summary = {
  totalSales: number;
  txCount: number;
  branchSummary: { branchId: string; branchName: string; totalSales: number; txCount: number }[];
  cashierSummary: { cashierId: string; cashierName: string; totalSales: number; txCount: number }[];
  topItems: { menuName: string; qty: number; total: number }[];
  dailyTrend: { date: string; total: number; count: number }[];
  transactions: {
    id: string; code: string; branchName: string; cashierName: string;
    total: number; discount: number; paidAmount: number; createdAt: string; itemCount: number;
  }[];
  branches: Branch[];
  cashiers: Cashier[];
};

function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return toInputDate(d);
}

export default function ReportsPage() {
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(toInputDate(new Date()));
  const [branchId, setBranchId] = useState("");
  const [cashierId, setCashierId] = useState("");
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ from, to });
    if (branchId) params.set("branchId", branchId);
    if (cashierId) params.set("cashierId", cashierId);
    const res = await fetch(`/api/admin/reports?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [from, to, branchId, cashierId]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const maxTrend = data ? Math.max(...data.dailyTrend.map((d) => d.total), 1) : 1;

  return (
    <div className="p-4 max-w-2xl mx-auto pb-8 space-y-4">
      <h1 className="font-bold text-gray-900 text-lg">Laporan Penjualan</h1>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Dari</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Sampai</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
            <option value="">Semua Cabang</option>
            {data?.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={cashierId} onChange={(e) => setCashierId(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
            <option value="">Semua Kasir</option>
            {data?.cashiers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button onClick={fetchReport} disabled={loading}
          className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
          <Search size={14} /> {loading ? "Memuat..." : "Tampilkan"}
        </button>
      </div>

      {!data && loading && <p className="text-center text-sm text-gray-400 py-8">Memuat...</p>}

      {data && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-400">Total Penjualan</p>
              <p className="font-bold text-gray-900 text-xl mt-1">{formatRp(data.totalSales)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-400">Transaksi</p>
              <p className="font-bold text-gray-900 text-xl mt-1">{data.txCount}</p>
            </div>
          </div>

          {/* Daily Trend Chart (CSS bars) */}
          {data.dailyTrend.length > 1 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 mb-3">Tren Harian</p>
              <div className="flex items-end gap-1.5 h-20">
                {data.dailyTrend.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-gray-900 rounded-t-sm min-h-[2px]"
                      style={{ height: `${Math.max(4, (d.total / maxTrend) * 72)}px` }}
                      title={`${formatDate(d.date)}: ${formatRp(d.total)}`}
                    />
                    <span className="text-[9px] text-gray-400 truncate w-full text-center">
                      {d.date.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per Branch */}
          {data.branchSummary.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <p className="px-4 py-3 text-xs font-semibold text-gray-500 border-b border-gray-100">Per Cabang</p>
              {data.branchSummary.map((b) => (
                <div key={b.branchId} className="px-4 py-3 flex justify-between items-center border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{b.branchName}</p>
                    <p className="text-xs text-gray-400">{b.txCount} transaksi</p>
                  </div>
                  <p className="font-bold text-gray-900">{formatRp(b.totalSales)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Per Cashier */}
          {data.cashierSummary.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <p className="px-4 py-3 text-xs font-semibold text-gray-500 border-b border-gray-100">Per Karyawan</p>
              {data.cashierSummary.map((c) => (
                <div key={c.cashierId} className="px-4 py-3 flex justify-between items-center border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.cashierName}</p>
                    <p className="text-xs text-gray-400">{c.txCount} transaksi</p>
                  </div>
                  <p className="font-bold text-gray-900">{formatRp(c.totalSales)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Top Items */}
          {data.topItems.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <p className="px-4 py-3 text-xs font-semibold text-gray-500 border-b border-gray-100">Menu Terlaris</p>
              {data.topItems.map((item, i) => (
                <div key={item.menuName} className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-bold text-gray-300 w-5 text-center">{i + 1}</span>
                  <p className="flex-1 text-sm text-gray-900">{item.menuName}</p>
                  <p className="text-xs text-gray-400">{item.qty} porsi</p>
                  <p className="text-sm font-semibold text-gray-900">{formatRp(item.total)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Transactions list */}
          {data.transactions.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <p className="px-4 py-3 text-xs font-semibold text-gray-500 border-b border-gray-100">
                Daftar Transaksi ({data.transactions.length})
              </p>
              {data.transactions.map((tx) => (
                <div key={tx.id} className="px-4 py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tx.code}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(tx.createdAt)} {formatTime(tx.createdAt)} · {tx.branchName} · {tx.cashierName}
                      </p>
                    </div>
                    <p className="font-bold text-gray-900">{formatRp(tx.total)}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{tx.itemCount} item</p>
                </div>
              ))}
            </div>
          )}

          {data.transactions.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-4">Tidak ada transaksi di periode ini</p>
          )}
        </>
      )}
    </div>
  );
}
