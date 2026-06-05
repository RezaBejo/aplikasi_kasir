"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Save, RefreshCw, Activity } from "lucide-react";

type Branch = { id: string; name: string; isActive: boolean };
type StockItem = {
  menuItemId: string;
  name: string;
  category: string;
  initialQty: number;
  remainingQty: number;
  sold: number;
  hasStock: boolean;
};
type BranchStock = { branch: Branch; items: StockItem[] };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function StockBar({ remaining, initial }: { remaining: number; initial: number }) {
  const pct = initial > 0 ? (remaining / initial) * 100 : 0;
  const color =
    remaining === 0 ? "bg-red-400" : pct <= 25 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

function StockBadge({ remaining }: { remaining: number }) {
  if (remaining === 0) return <span className="text-xs font-bold text-red-500">Habis</span>;
  if (remaining <= 5) return <span className="text-xs font-bold text-amber-500">{remaining}</span>;
  return <span className="text-xs font-bold text-emerald-600">{remaining}</span>;
}

// ─── TAB: MONITOR ────────────────────────────────────────────────────────────

function MonitorTab({ branches, date }: { branches: Branch[]; date: string }) {
  const [data, setData] = useState<BranchStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAll = useCallback(async () => {
    if (branches.length === 0) return;
    const results = await Promise.all(
      branches.map(async (b) => {
        const res = await fetch(`/api/admin/stock?branchId=${b.id}&date=${date}`);
        const items: StockItem[] = res.ok ? await res.json() : [];
        return { branch: b, items };
      })
    );
    setData(results);
    setLastUpdate(new Date());
    setLoading(false);
  }, [branches, date]);

  useEffect(() => {
    setLoading(true);
    fetchAll();
    intervalRef.current = setInterval(fetchAll, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchAll]);

  const categories = Array.from(
    new Set(data.flatMap((d) => d.items.map((i) => i.category)))
  );

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-gray-400">Auto-refresh tiap 30 detik</span>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-gray-400">
              Update: {lastUpdate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <button
            onClick={fetchAll}
            className="p-1.5 rounded-lg bg-gray-100 text-gray-500 active:bg-gray-200"
            title="Refresh sekarang"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-400 text-sm flex items-center justify-center gap-2">
          <RefreshCw size={14} className="animate-spin" /> Memuat...
        </div>
      )}

      {/* Legend */}
      {!loading && (
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />Aman</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Sedikit (≤5)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" />Habis</span>
        </div>
      )}

      {/* Per category */}
      {!loading && categories.map((cat) => (
        <div key={cat} className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100">{cat}</p>

          {/* Branch headers */}
          {data[0]?.items.filter((i) => i.category === cat).map((item) => {
            const stocks = data.map((d) => ({
              branch: d.branch,
              stock: d.items.find((i) => i.menuItemId === item.menuItemId),
            }));
            return (
              <div key={item.menuItemId} className="px-4 py-3 border-b border-gray-50 last:border-0">
                <p className="text-sm font-medium text-gray-900 mb-2">{item.name}</p>
                <div className={`grid gap-3 ${data.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                  {stocks.map(({ branch, stock }) => (
                    <div key={branch.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 truncate">{branch.name}</span>
                        <div className="flex items-center gap-1">
                          {stock ? <StockBadge remaining={stock.remainingQty} /> : <span className="text-xs text-gray-300">—</span>}
                          {stock && stock.initialQty > 0 && (
                            <span className="text-xs text-gray-300">/{stock.initialQty}</span>
                          )}
                        </div>
                      </div>
                      {stock && stock.initialQty > 0 && (
                        <StockBar remaining={stock.remainingQty} initial={stock.initialQty} />
                      )}
                      {stock && stock.sold > 0 && (
                        <p className="text-[10px] text-gray-300">Terjual: {stock.sold}</p>
                      )}
                      {!stock && (
                        <p className="text-[10px] text-gray-300">Belum di-set</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {!loading && categories.length === 0 && (
        <p className="text-center py-12 text-gray-400 text-sm">Stok belum diisi untuk hari ini</p>
      )}
    </div>
  );
}

// ─── TAB: ATUR STOK ──────────────────────────────────────────────────────────

function SetStokTab({ branches }: { branches: Branch[] }) {
  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id ?? "");
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [items, setItems] = useState<StockItem[]>([]);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (branches.length > 0 && !selectedBranch) setSelectedBranch(branches[0].id);
  }, [branches, selectedBranch]);

  useEffect(() => {
    if (!selectedBranch || !selectedDate) return;
    setLoading(true);
    setItems([]);
    fetch(`/api/admin/stock?branchId=${selectedBranch}&date=${selectedDate}`)
      .then((r) => r.json())
      .then((data: StockItem[]) => {
        setItems(data);
        const q: Record<string, number> = {};
        data.forEach((i) => (q[i.menuItemId] = i.initialQty));
        setQtys(q);
        setLoading(false);
      });
  }, [selectedBranch, selectedDate]);

  const refreshItems = useCallback(() => {
    if (!selectedBranch || !selectedDate) return;
    fetch(`/api/admin/stock?branchId=${selectedBranch}&date=${selectedDate}`)
      .then((r) => r.json())
      .then((data: StockItem[]) => {
        setItems(data);
        const q: Record<string, number> = {};
        data.forEach((i) => (q[i.menuItemId] = i.initialQty));
        setQtys(q);
      });
  }, [selectedBranch, selectedDate]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        branchId: selectedBranch,
        date: selectedDate,
        items: Object.entries(qtys).map(([menuItemId, qty]) => ({ menuItemId, qty })),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      refreshItems();
    } else {
      const d = await res.json();
      setError(d.error ?? "Gagal menyimpan");
    }
  };

  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div className="space-y-3 pb-24">
      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      {/* Info: sold qty warning */}
      {items.some((i) => i.sold > 0) && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          <p className="text-xs text-amber-700 font-medium">Sebagian menu sudah terjual hari ini.</p>
          <p className="text-xs text-amber-600 mt-0.5">Jika qty diubah, sisa porsi dihitung ulang: Qty Baru − Terjual.</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-gray-400 text-sm flex items-center justify-center gap-2">
          <RefreshCw size={14} className="animate-spin" /> Memuat...
        </div>
      )}

      {!loading && items.length === 0 && selectedBranch && (
        <p className="text-center py-12 text-gray-400 text-sm">Belum ada menu aktif</p>
      )}

      {/* Stock form per category */}
      {!loading && categories.map((cat) => (
        <div key={cat} className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100">{cat}</p>
          {items.filter((i) => i.category === cat).map((item) => (
            <div key={item.menuItemId} className="px-4 py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {item.initialQty > 0 ? (
                      <>
                        <StockBar remaining={item.remainingQty} initial={item.initialQty} />
                        <span className="text-xs whitespace-nowrap">
                          <StockBadge remaining={item.remainingQty} />
                          <span className="text-gray-300">/{item.initialQty}</span>
                          {item.sold > 0 && <span className="text-gray-300 ml-1">(−{item.sold})</span>}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-300">Belum di-set</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQtys((q) => ({ ...q, [item.menuItemId]: Math.max(0, (q[item.menuItemId] ?? 0) - 1) }))}
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg font-medium active:bg-gray-200"
                  >−</button>
                  <input
                    type="number"
                    min={0}
                    value={qtys[item.menuItemId] ?? 0}
                    onChange={(e) => setQtys((q) => ({ ...q, [item.menuItemId]: Math.max(0, Number(e.target.value)) }))}
                    className="w-14 text-center border border-gray-200 rounded-lg py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <button
                    onClick={() => setQtys((q) => ({ ...q, [item.menuItemId]: (q[item.menuItemId] ?? 0) + 1 }))}
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg font-medium active:bg-gray-200"
                  >+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {/* Sticky save */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full max-w-2xl mx-auto block bg-gray-900 text-white py-4 rounded-2xl font-bold text-sm disabled:opacity-50 active:bg-gray-700"
          >
            {saving ? "Menyimpan..." : saved ? "✓ Tersimpan" : (
              <span className="flex items-center justify-center gap-2"><Save size={16} /> Simpan Stok</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function StockPage() {
  const [tab, setTab] = useState<"set" | "monitor">("set");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [date] = useState(todayStr());

  useEffect(() => {
    fetch("/api/admin/branches")
      .then((r) => r.json())
      .then((data: Branch[]) => setBranches(data.filter((b) => b.isActive)));
  }, []);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-bold text-gray-900 text-lg">Stok Harian</h1>
        <span className="text-xs text-gray-400">{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}</span>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        <button
          onClick={() => setTab("set")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "set" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          <Save size={13} /> Atur Stok
        </button>
        <button
          onClick={() => setTab("monitor")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "monitor" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          <Activity size={13} /> Monitor
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      </div>

      {tab === "set" && <SetStokTab branches={branches} />}
      {tab === "monitor" && <MonitorTab branches={branches} date={date} />}
    </div>
  );
}
