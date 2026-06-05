"use client";

import { useState, useEffect } from "react";
import { Save, RefreshCw } from "lucide-react";

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

export default function StockPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [items, setItems] = useState<StockItem[]>([]);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  useEffect(() => {
    fetch("/api/admin/branches")
      .then((r) => r.json())
      .then((data: Branch[]) => {
        const active = data.filter((b) => b.isActive !== false);
        setBranches(active);
        if (active.length > 0) setSelectedBranch(active[0].id);
      });
  }, []);

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
      // Refresh items
      fetch(`/api/admin/stock?branchId=${selectedBranch}&date=${selectedDate}`)
        .then((r) => r.json())
        .then(setItems);
    } else {
      const d = await res.json();
      setError(d.error ?? "Gagal menyimpan");
    }
  };

  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      <h1 className="font-bold text-gray-900 text-lg mb-4">Atur Stok Harian</h1>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
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

      {loading && (
        <div className="text-center py-12 text-gray-400 text-sm flex items-center justify-center gap-2">
          <RefreshCw size={14} className="animate-spin" /> Memuat...
        </div>
      )}

      {!loading && items.length === 0 && selectedBranch && (
        <p className="text-center py-12 text-gray-400 text-sm">Belum ada menu aktif</p>
      )}

      {/* Stock table per category */}
      {!loading && categories.map((cat) => (
        <div key={cat} className="bg-white rounded-2xl shadow-sm overflow-hidden mb-3">
          <p className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100">
            {cat}
          </p>
          {items.filter((i) => i.category === cat).map((item) => (
            <div key={item.menuItemId} className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                {item.sold > 0 && (
                  <p className="text-xs text-gray-400">Terjual: {item.sold} · Sisa: {item.remainingQty}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQtys((q) => ({ ...q, [item.menuItemId]: Math.max(0, (q[item.menuItemId] ?? 0) - 1) }))}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg font-medium active:bg-gray-200"
                >
                  −
                </button>
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
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {error && <p className="text-sm text-red-500 text-center mt-2">{error}</p>}

      {/* Sticky save button */}
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
