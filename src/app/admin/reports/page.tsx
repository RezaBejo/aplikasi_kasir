"use client";

import { useState, useEffect, useCallback } from "react";
import { formatRp, formatDate, formatTime, toInputDate } from "@/lib/format";
import { appConfig } from "@/config/app";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LabelList,
} from "recharts";
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

function formatK(val: number) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}rb`;
  return String(val);
}

// Recharts formatters — use unknown to satisfy ValueType | undefined constraint
const fmtSales = (val: unknown): [string, string] =>
  [formatRp(Number(val ?? 0)), "Penjualan"];
const fmtItems = (val: unknown, name: unknown): [string, string] =>
  (name as string) === "qty"
    ? [`${Number(val ?? 0)} porsi`, "Qty"]
    : [formatRp(Number(val ?? 0)), "Total"];
const fmtLabel = (v: unknown) => `${Number(v ?? 0)}×`;

const TOOLTIP_STYLE = {
  contentStyle: { fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb", padding: "6px 10px" },
  labelStyle: { fontSize: 11, color: "#374151", fontWeight: 600 },
};

// Quick-date presets
type Preset = { label: string; days: number };
const PRESETS: Preset[] = [
  { label: "7H", days: 7 },
  { label: "14H", days: 14 },
  { label: "30H", days: 30 },
];

export default function ReportsPage() {
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(toInputDate(new Date()));
  const [branchId, setBranchId] = useState("");
  const [cashierId, setCashierId] = useState("");
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTxList, setShowTxList] = useState(false);

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

  const applyPreset = (days: number) => {
    const t = new Date();
    const f = new Date();
    f.setDate(f.getDate() - (days - 1));
    setFrom(toInputDate(f));
    setTo(toInputDate(t));
  };

  // Enrich trend with short date labels
  const trendData = data?.dailyTrend.map((d) => ({
    ...d,
    label: d.date.slice(5).replace("-", "/"),
  })) ?? [];

  // Top items bar chart data (horizontal)
  const topChartData = data?.topItems.slice(0, 7).map((i) => ({
    name: i.menuName.length > 14 ? i.menuName.slice(0, 14) + "…" : i.menuName,
    qty: i.qty,
    total: i.total,
    fullName: i.menuName,
  })) ?? [];

  // Branch bar chart
  const branchChartData = data?.branchSummary
    .sort((a, b) => b.totalSales - a.totalSales)
    .map((b) => ({ name: b.branchName, total: b.totalSales })) ?? [];

  return (
    <div className="p-4 max-w-2xl mx-auto pb-8 space-y-4">
      <h1 className="font-bold text-gray-900 text-lg">Laporan Penjualan</h1>

      {/* Filter card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        {/* Preset buttons */}
        <div className="flex gap-2">
          {PRESETS.map((p) => (
            <button key={p.days} onClick={() => applyPreset(p.days)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 active:bg-gray-50">
              {p.label}
            </button>
          ))}
          <span className="flex-1" />
          <span className="text-xs text-gray-400 self-center">atau pilih manual:</span>
        </div>
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
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-900 text-white rounded-2xl p-3">
              <p className="text-[10px] text-gray-400">Penjualan</p>
              <p className="font-bold text-base mt-0.5 leading-tight">{formatRp(data.totalSales)}</p>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm">
              <p className="text-[10px] text-gray-400">Transaksi</p>
              <p className="font-bold text-gray-900 text-base mt-0.5">{data.txCount}</p>
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-sm">
              <p className="text-[10px] text-gray-400">Rata-rata</p>
              <p className="font-bold text-gray-900 text-base mt-0.5">
                {data.txCount > 0 ? formatRp(Math.round(data.totalSales / data.txCount)) : "—"}
              </p>
            </div>
          </div>

          {/* Trend chart — AreaChart */}
          {trendData.length >= 2 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-700 mb-3">Tren Harian</p>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={trendData} margin={{ top: 5, right: 4, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={appConfig.themeColor} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={appConfig.themeColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#9ca3af" }} />
                  <YAxis tickFormatter={formatK} tick={{ fontSize: 9, fill: "#9ca3af" }} width={36} />
                  <Tooltip
                    {...TOOLTIP_STYLE}
                    formatter={fmtSales}
                  />
                  <Area type="monotone" dataKey="total" stroke={appConfig.themeColor} strokeWidth={2}
                    fill="url(#areaGrad)" dot={false} activeDot={{ r: 4, fill: appConfig.themeColor }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Per Branch */}
          {data.branchSummary.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <p className="px-4 py-3 text-xs font-semibold text-gray-500 border-b border-gray-100">Per Cabang</p>
              {data.branchSummary.sort((a, b) => b.totalSales - a.totalSales).map((b) => (
                <div key={b.branchId} className="px-4 py-3 border-b border-gray-50 last:border-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{b.branchName}</p>
                      <p className="text-xs text-gray-400">{b.txCount} transaksi</p>
                    </div>
                    <p className="font-bold text-gray-900">{formatRp(b.totalSales)}</p>
                  </div>
                  {data.totalSales > 0 && (
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand rounded-full"
                        style={{ width: `${Math.round((b.totalSales / data.totalSales) * 100)}%` }} />
                    </div>
                  )}
                </div>
              ))}
              {/* Branch bar chart jika ≥2 cabang */}
              {branchChartData.length >= 2 && (
                <div className="px-4 pb-3 pt-2">
                  <ResponsiveContainer width="100%" height={branchChartData.length * 40 + 16}>
                    <BarChart data={branchChartData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                      <XAxis type="number" tickFormatter={formatK} tick={{ fontSize: 9, fill: "#9ca3af" }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#374151" }} width={72} />
                      <Tooltip {...TOOLTIP_STYLE} formatter={fmtSales} />
                      <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={20}>
                        {branchChartData.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? appConfig.themeColor : "#d1d5db"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Per Cashier */}
          {data.cashierSummary.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <p className="px-4 py-3 text-xs font-semibold text-gray-500 border-b border-gray-100">Per Karyawan</p>
              {data.cashierSummary.sort((a, b) => b.totalSales - a.totalSales).map((c, i) => (
                <div key={c.cashierId} className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-bold text-gray-300 w-5 text-center">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{c.cashierName}</p>
                    <p className="text-xs text-gray-400">{c.txCount} transaksi</p>
                  </div>
                  <p className="font-bold text-gray-900">{formatRp(c.totalSales)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Top Items — horizontal bar chart */}
          {topChartData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <p className="px-4 py-3 text-xs font-semibold text-gray-500 border-b border-gray-100">Menu Terlaris</p>
              <div className="px-4 py-3">
                <ResponsiveContainer width="100%" height={topChartData.length * 36 + 8}>
                  <BarChart data={topChartData} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#374151" }} width={80} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={fmtItems} />
                    <Bar dataKey="qty" radius={[0, 4, 4, 0]} maxBarSize={18} fill={appConfig.themeColor}>
                      <LabelList dataKey="qty" position="right" style={{ fontSize: 10, fill: "#6b7280" }} formatter={fmtLabel} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Table below chart */}
              {data.topItems.map((item, i) => (
                <div key={item.menuName} className="px-4 py-2.5 flex items-center gap-3 border-t border-gray-50">
                  <span className="text-xs font-bold text-gray-300 w-5 text-center">{i + 1}</span>
                  <p className="flex-1 text-sm text-gray-900">{item.menuName}</p>
                  <p className="text-xs text-gray-400">{item.qty} porsi</p>
                  <p className="text-sm font-semibold text-gray-900">{formatRp(item.total)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Transactions — collapsible */}
          {data.transactions.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setShowTxList(!showTxList)}
                className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-100 active:bg-gray-50"
              >
                <p className="text-xs font-semibold text-gray-500">
                  Daftar Transaksi ({data.transactions.length})
                </p>
                {showTxList ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
              </button>
              {showTxList && data.transactions.map((tx) => (
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
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-xs text-gray-400">{tx.itemCount} item</p>
                    {tx.discount > 0 && <p className="text-xs text-gray-400">Diskon {formatRp(tx.discount)}</p>}
                  </div>
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
