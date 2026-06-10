"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  X,
  ClockIcon,
  LogOut,
  CheckCircle2,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

type MenuWithStock = {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string | null;
  remainingQty: number;
  hasStock: boolean;
};

type CartItem = {
  menuItemId: string;
  menuName: string;
  price: number;
  qty: number;
  lineTotal: number;
};

function formatRp(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function PosScreen({
  branchName,
  cashierName,
}: {
  branchName: string;
  cashierName: string;
}) {
  const [menuItems, setMenuItems] = useState<MenuWithStock[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [discount, setDiscount] = useState(0);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paidInput, setPaidInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [txError, setTxError] = useState("");
  const [txSuccess, setTxSuccess] = useState<{
    code: string;
    change: number;
  } | null>(null);

  const fetchMenu = useCallback(async () => {
    setFetchError("");
    const res = await fetch("/api/pos/menu");
    if (res.ok) {
      setMenuItems(await res.json());
    } else {
      setFetchError("Gagal memuat menu. Coba refresh.");
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // Derived values
  const categories = [
    "all",
    ...Array.from(new Set(menuItems.map((m) => m.category))),
  ];
  const filteredMenu =
    activeCategory === "all"
      ? menuItems
      : menuItems.filter((m) => m.category === activeCategory);

  const subtotal = cart.reduce((s, i) => s + i.lineTotal, 0);
  const total = Math.max(0, subtotal - discount);
  const paidAmount = parseInt(paidInput.replace(/\D/g, ""), 10) || 0;
  const change = paidAmount - total;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  // Cart operations
  const addToCart = (item: MenuWithStock) => {
    if (!item.hasStock || item.remainingQty <= 0) return;
    const existing = cart.find((c) => c.menuItemId === item.id);
    const currentQty = existing?.qty ?? 0;
    if (currentQty >= item.remainingQty) return;

    if (existing) {
      setCart(
        cart.map((c) =>
          c.menuItemId === item.id
            ? { ...c, qty: c.qty + 1, lineTotal: (c.qty + 1) * c.price }
            : c
        )
      );
    } else {
      setCart([
        ...cart,
        {
          menuItemId: item.id,
          menuName: item.name,
          price: item.price,
          qty: 1,
          lineTotal: item.price,
        },
      ]);
    }
  };

  const updateQty = (menuItemId: string, delta: number) => {
    const item = cart.find((c) => c.menuItemId === menuItemId);
    if (!item) return;
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      setCart(cart.filter((c) => c.menuItemId !== menuItemId));
      return;
    }
    const stock = menuItems.find((m) => m.id === menuItemId);
    if (stock && newQty > stock.remainingQty) return;
    setCart(
      cart.map((c) =>
        c.menuItemId === menuItemId
          ? { ...c, qty: newQty, lineTotal: newQty * c.price }
          : c
      )
    );
  };

  const removeFromCart = (menuItemId: string) =>
    setCart(cart.filter((c) => c.menuItemId !== menuItemId));

  // Submit transaction
  const handleSubmit = async () => {
    if (!cart.length || paidAmount < total || loading) return;
    setLoading(true);
    setTxError("");

    const res = await fetch("/api/pos/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart, discount, paidAmount }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setTxError(data.error ?? "Terjadi kesalahan");
      return;
    }

    setTxSuccess({ code: data.transaction.code, change });
    setCart([]);
    setDiscount(0);
    setPaidInput("");
    await fetchMenu();
  };

  const closeCheckout = () => {
    setIsCheckoutOpen(false);
    setTxError("");
    setTxSuccess(null);
    setPaidInput("");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div>
          <p className="font-bold text-gray-900 leading-tight">{branchName}</p>
          <p className="text-xs text-gray-400">{cashierName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/pos/history"
            className="p-2 rounded-xl bg-gray-100 text-gray-600 active:bg-gray-200"
            title="Riwayat"
          >
            <ClockIcon size={20} />
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 rounded-xl bg-gray-100 text-gray-600 active:bg-gray-200"
            title="Keluar"
          >
            <LogOut size={20} />
          </button>
          <button
            onClick={() => cart.length && setIsCheckoutOpen(true)}
            className={`relative p-2 rounded-xl transition-colors ${
              cart.length
                ? "bg-brand text-white"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-0.5">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Category Tabs ── */}
      {categories.length > 1 && (
        <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide sticky top-[57px] z-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? "bg-brand text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {cat === "all" ? "Semua" : cat}
            </button>
          ))}
        </div>
      )}

      {/* ── Menu Grid ── */}
      <main className="flex-1 p-3">
        {fetchError && (
          <div className="text-center py-8 text-red-500 text-sm">{fetchError}</div>
        )}
        {!fetchError && menuItems.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            Belum ada menu atau stok hari ini.
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredMenu.map((item) => {
            const inCart = cart.find((c) => c.menuItemId === item.id)?.qty ?? 0;
            const isDisabled = !item.hasStock || item.remainingQty <= 0;

            return (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                disabled={isDisabled}
                className={`relative bg-white rounded-2xl p-4 text-left shadow-sm border-2 transition-all duration-150 select-none
                  ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed border-transparent"
                      : inCart > 0
                      ? "border-brand shadow-md"
                      : "border-transparent active:scale-95 active:shadow-none"
                  }`}
              >
                {/* Cart badge */}
                {inCart > 0 && (
                  <span className="absolute top-2.5 right-2.5 bg-brand text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {inCart}
                  </span>
                )}

                <p className="font-semibold text-gray-900 text-sm leading-snug pr-7">
                  {item.name}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">{item.category}</p>
                <p className="font-bold text-gray-900 mt-3 text-base">
                  {formatRp(item.price)}
                </p>
                <p
                  className={`text-xs mt-1 font-medium ${
                    isDisabled ? "text-red-500" : "text-emerald-600"
                  }`}
                >
                  {isDisabled ? "Habis" : `Sisa ${item.remainingQty}`}
                </p>
              </button>
            );
          })}
        </div>
      </main>

      {/* ── Sticky Cart Bar ── */}
      {cart.length > 0 && !isCheckoutOpen && (
        <div className="sticky bottom-0 z-10 bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-4 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
          <div className="flex-1">
            <p className="text-xs text-gray-400">{cartCount} item dipilih</p>
            <p className="font-bold text-gray-900 text-lg">{formatRp(total)}</p>
          </div>
          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="bg-brand text-white px-8 py-3.5 rounded-2xl font-bold text-sm active:bg-brand-light"
          >
            Bayar
          </button>
        </div>
      )}

      {/* ── Checkout Modal ── */}
      {isCheckoutOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && closeCheckout()}
        >
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">
                {txSuccess ? "Transaksi Berhasil" : "Ringkasan Pesanan"}
              </h2>
              <button
                onClick={closeCheckout}
                className="p-1.5 rounded-full bg-gray-100 text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── Success State ── */}
            {txSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
                <CheckCircle2 size={56} className="text-emerald-500" />
                <div>
                  <p className="font-bold text-gray-900 text-lg">Transaksi Tersimpan</p>
                  <p className="text-sm text-gray-400 mt-1">{txSuccess.code}</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl px-8 py-4 w-full">
                  <p className="text-sm text-gray-500">Kembalian</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1">
                    {formatRp(txSuccess.change)}
                  </p>
                </div>
                <button
                  onClick={closeCheckout}
                  className="w-full bg-brand text-white py-4 rounded-2xl font-bold mt-2 active:bg-brand-light"
                >
                  Transaksi Baru
                </button>
              </div>
            ) : (
              <>
                {/* ── Cart Items (scrollable) ── */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {cart.map((item) => (
                    <div key={item.menuItemId} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {item.menuName}
                        </p>
                        <p className="text-xs text-gray-400">{formatRp(item.price)}</p>
                      </div>
                      {/* Qty controls */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQty(item.menuItemId, -1)}
                          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-6 text-center font-semibold text-sm">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.menuItemId, 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <p className="w-20 text-right text-sm font-semibold text-gray-900">
                        {formatRp(item.lineTotal)}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.menuItemId)}
                        className="w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center active:bg-red-100"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* ── Payment Section ── */}
                <div className="px-5 pb-5 pt-3 border-t border-gray-100 space-y-3">
                  {/* Discount */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-500 w-20 shrink-0">Diskon (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      value={discount || ""}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  {/* Totals */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal</span>
                      <span>{formatRp(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Diskon</span>
                        <span>-{formatRp(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100">
                      <span>Total</span>
                      <span>{formatRp(total)}</span>
                    </div>
                  </div>

                  {/* Payment input */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-500 w-20 shrink-0">Bayar (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      value={paidInput}
                      onChange={(e) => setPaidInput(e.target.value)}
                      placeholder="Jumlah tunai"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                      autoFocus
                    />
                  </div>

                  {/* Change indicator */}
                  {paidAmount >= total && paidAmount > 0 && (
                    <div className="flex justify-between font-bold text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2">
                      <span>Kembalian</span>
                      <span>{formatRp(change)}</span>
                    </div>
                  )}
                  {paidAmount > 0 && paidAmount < total && (
                    <p className="text-sm text-red-500 text-center">
                      Kurang {formatRp(total - paidAmount)}
                    </p>
                  )}

                  {txError && (
                    <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2 text-center">
                      {txError}
                    </p>
                  )}

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={!cart.length || paidAmount < total || loading}
                    className="w-full bg-brand text-white py-4 rounded-2xl font-bold text-base disabled:opacity-40 active:bg-brand-light mt-1"
                  >
                    {loading ? "Memproses..." : `Simpan  •  ${formatRp(total)}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
