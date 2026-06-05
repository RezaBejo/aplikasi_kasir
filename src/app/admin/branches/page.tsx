"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, X, Check } from "lucide-react";

type Branch = { id: string; name: string; location: string | null; isActive: boolean };

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", location: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", location: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchBranches = async () => {
    const res = await fetch("/api/admin/branches");
    if (res.ok) setBranches(await res.json());
  };

  useEffect(() => { fetchBranches(); }, []);

  const handleAdd = async () => {
    if (!form.name) { setError("Nama cabang wajib diisi"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/admin/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, location: form.location || null }),
    });
    setSaving(false);
    if (res.ok) { setForm({ name: "", location: "" }); setShowAdd(false); fetchBranches(); }
    else { const d = await res.json(); setError(d.error); }
  };

  const handleEdit = async (id: string) => {
    setSaving(true); setError("");
    const res = await fetch(`/api/admin/branches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editForm.name, location: editForm.location || null }),
    });
    setSaving(false);
    if (res.ok) { setEditId(null); fetchBranches(); }
    else { const d = await res.json(); setError(d.error); }
  };

  const toggleActive = async (b: Branch) => {
    await fetch(`/api/admin/branches/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !b.isActive }),
    });
    fetchBranches();
  };

  return (
    <div className="p-4 max-w-2xl mx-auto pb-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-gray-900 text-lg">Manajemen Cabang</h1>
        <button onClick={() => { setShowAdd(!showAdd); setError(""); }}
          className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={14} /> Tambah
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <p className="font-semibold text-sm text-gray-900">Cabang Baru</p>
          <input placeholder="Nama cabang *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          <input placeholder="Lokasi (opsional)" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
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

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {branches.length === 0 && (
          <p className="px-4 py-8 text-xs text-gray-400 text-center">Belum ada cabang</p>
        )}
        {branches.map((b) => (
          <div key={b.id} className="border-b border-gray-50 last:border-0">
            {editId === b.id ? (
              <div className="px-4 py-3 space-y-2">
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Nama cabang"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                <input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="Lokasi"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                {error && <p className="text-xs text-red-500">{error}</p>}
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(b.id)} disabled={saving}
                    className="flex items-center gap-1 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                    <Check size={12} /> Simpan
                  </button>
                  <button onClick={() => setEditId(null)}
                    className="flex items-center gap-1 text-gray-500 px-3 py-1.5 rounded-lg text-xs border border-gray-200">
                    <X size={12} /> Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className={`text-sm font-medium ${b.isActive ? "text-gray-900" : "text-gray-400"}`}>{b.name}</p>
                  {b.location && <p className="text-xs text-gray-400">{b.location}</p>}
                </div>
                <button onClick={() => toggleActive(b)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    b.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
                  }`}>
                  {b.isActive ? "Aktif" : "Nonaktif"}
                </button>
                <button onClick={() => { setEditId(b.id); setEditForm({ name: b.name, location: b.location ?? "" }); setError(""); }}
                  className="p-2 rounded-xl bg-gray-100 text-gray-600 active:bg-gray-200">
                  <Pencil size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
