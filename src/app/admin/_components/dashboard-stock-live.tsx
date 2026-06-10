"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";

type StockItem = {
  id: string;
  menuName: string;
  initialQty: number;
  remainingQty: number;
};

type BranchStock = {
  id: string;
  name: string;
  stockItems: StockItem[];
};

export function DashboardStockLive() {
  const [data, setData] = useState<BranchStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStock = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard/stock", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdated(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStock();
    intervalRef.current = setInterval(fetchStock, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStock]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Memuat stok…</p>;
  }

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada cabang aktif atau stok hari ini belum diatur.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Auto-refresh setiap 60 detik
          {lastUpdated && (
            <> · Diperbarui {lastUpdated.toLocaleTimeString("id-ID")}</>
          )}
        </p>
        <button
          onClick={() => { setLoading(true); fetchStock(); }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>

      {data.map((branch) => {
        const hasStock = branch.stockItems.length > 0;
        const outOfStock = branch.stockItems.filter((s) => s.remainingQty === 0).length;

        return (
          <div key={branch.id} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{branch.name}</h4>
              {outOfStock > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  {outOfStock} habis
                </span>
              )}
            </div>

            {!hasStock ? (
              <p className="text-xs text-muted-foreground">Stok belum diatur hari ini</p>
            ) : (
              <div className="space-y-1.5">
                {branch.stockItems.map((item) => {
                  const pct =
                    item.initialQty === 0
                      ? 0
                      : Math.round((item.remainingQty / item.initialQty) * 100);
                  const barColor =
                    item.remainingQty === 0
                      ? "bg-red-500"
                      : item.remainingQty <= 5
                      ? "bg-amber-500"
                      : "bg-emerald-500";

                  return (
                    <div key={item.id}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="truncate max-w-[60%]">{item.menuName}</span>
                        <span
                          className={
                            item.remainingQty === 0
                              ? "text-red-600 dark:text-red-400 font-semibold"
                              : item.remainingQty <= 5
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                          }
                        >
                          {item.remainingQty}/{item.initialQty}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
