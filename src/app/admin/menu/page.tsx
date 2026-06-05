"use client";

import { useState, useEffect } from "react";
import { formatRp } from "@/lib/format";
import { Plus, Pencil, X, Check } from "lucide-react";

type MenuItem = {
  id: string; name: string; category: string;
  price: number; imageUrl: string | null; isActive: boolean;
};

const EMPTY = { name: "", category: "", price: "", imageUrl: "" };

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchItems = async () => {
    const res = await fetch("/api/admin/menu");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.category || !form.price) return;
    setSaving(true); setError("");
    const res = await fetch("/api/admin/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, category: form.category, price: Number(form.price), imageUrl: form.imageUrl || null }),
    });
    setSaving(false);
    if (res.ok) { setForm(EMPTY); setShowAdd(false); fetchItems(); }
    else { const d = await res.json(); setError(d.error); }
  };

  const handleEdit = async (id: string) => {
    setSaving(true); setError("");
    const res = await fetch(`/api/admin/menu/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editForm.name, category: editForm.category, price: Number(editForm.price), imageUrl: editForm.imageUrl || null }),
    });
    setSaving(false);
    if (res.ok) { setEditId(null); fetchItems(); }
    else { const d = await res.json(); setError(d.error); }
  };

  const toggleActive = async (item: MenuItem) => {
    await fetch(`/api/admin/menu/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    fetchItems();
  };

  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div className="p-4 max-w-2xl mx-auto pb-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-gray-900 text-lg">Manajemen Menu</h1>
        <button onClick={() => { setShowAdd(!showAdd); setError(""); }}
          className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={14} /> Tambah
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <p className="font-semibold text-sm text-gray-900">Menu Baru</p>
          <input placeholder="Nama menu *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Kategori *" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            <input type="number" placeholder="Harga *" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving}
              className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">
              Batal
            </button>
          </div>
        </div>
      )}

      {loading && <p className="text-center text-sm text-gray-400 py-8">Memuat...</p>}

      {/* Menu list per category */}
      {categories.map((cat) => (
        <div key={cat} className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100">{cat}</p>
          {items.filter((i) => i.category === cat).map((item) => (
            <div key={item.id} className="border-b border-gray-50 last:border-0">
              {editId === item.id ? (
                <div className="px-4 py-3 space-y-2">
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                    <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                  </div>
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(item.id)} disabled={saving}
                      className="flex items-center gap-1 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                      <Check size={12} /> Simpan
                    </button>
                    <button onClick={() => setEditId(null)} className="flex items-center gap-1 text-gray-500 px-3 py-1.5 rounded-lg text-xs border border-gray-200">
                      <X size={12} /> Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${item.isActive ? "text-gray-900" : "text-gray-400 line-through"}`}>
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-400">{formatRp(item.price)}</p>
                  </div>
                  <button onClick={() => toggleActive(item)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      item.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
                    }`}>
                    {item.isActive ? "Aktif" : "Nonaktif"}
                  </button>
                  <button onClick={() => { setEditId(item.id); setEditForm({ name: item.name, category: item.category, price: String(item.price), imageUrl: item.imageUrl ?? "" }); setError(""); }}
                    className="p-2 rounded-xl bg-gray-100 text-gray-600 active:bg-gray-200">
                    <Pencil size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
