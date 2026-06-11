"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, X, Check, Eye, EyeOff, Trash2, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

type Branch = { id: string; name: string; isActive: boolean };
type Staff = {
  id: string; name: string; username: string; isActive: boolean;
  branchId: string | null; branch: { name: string } | null;
  txCount: number;
};

const EMPTY_FORM = { name: "", username: "", password: "", branchId: "" };

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", branchId: "", newPassword: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchData = async () => {
    const [sRes, bRes] = await Promise.all([fetch("/api/admin/staff"), fetch("/api/admin/branches")]);
    if (sRes.ok) setStaff(await sRes.json());
    if (bRes.ok) setBranches(await bRes.json());
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.username || !form.password || !form.branchId) {
      setError("Semua field wajib diisi"); return;
    }
    setSaving(true); setError("");
    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setForm(EMPTY_FORM); setShowAdd(false); fetchData(); }
    else { const d = await res.json(); setError(d.error); }
  };

  const handleEdit = async (id: string) => {
    setSaving(true); setError("");
    const payload: Record<string, string> = { name: editForm.name, branchId: editForm.branchId };
    if (editForm.newPassword) payload.newPassword = editForm.newPassword;
    const res = await fetch(`/api/admin/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) { setEditId(null); fetchData(); }
    else { const d = await res.json(); setError(d.error); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true); setDeleteError("");
    const res = await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) { setConfirmDeleteId(null); fetchData(); }
    else { const d = await res.json(); setDeleteError(d.error ?? "Gagal menghapus"); }
  };

  const toggleActive = async (s: Staff) => {
    await fetch(`/api/admin/staff/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    fetchData();
  };

  const activeBranches = branches.filter((b) => b.isActive);

  return (
    <div className="p-4 max-w-2xl mx-auto pb-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-gray-900 text-lg">Manajemen Karyawan</h1>
        <button onClick={() => { setShowAdd(!showAdd); setError(""); }}
          className="flex items-center gap-1.5 bg-brand text-white px-4 py-2 rounded-xl text-sm font-medium">
          <Plus size={14} /> Tambah
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <p className="font-semibold text-sm text-gray-900">Kasir Baru</p>
          <input placeholder="Nama lengkap *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Username *" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
            <div className="relative">
              <input type={showPwd ? "text" : "password"} placeholder="Password *" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
              <button onClick={() => setShowPwd(!showPwd)} className="absolute right-2.5 top-2.5 text-gray-400">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand">
            <option value="">-- Pilih Cabang *</option>
            {activeBranches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving}
              className="flex-1 bg-brand text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Staff list */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {staff.length === 0 && (
          <p className="px-4 py-8 text-xs text-gray-400 text-center">Belum ada karyawan</p>
        )}
        {staff.map((s) => (
          <div key={s.id} className="border-b border-gray-50 last:border-0">
            {editId === s.id ? (
              <div className="px-4 py-3 space-y-2">
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Nama"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                <select value={editForm.branchId} onChange={(e) => setEditForm({ ...editForm, branchId: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand">
                  {activeBranches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <input type="password" placeholder="Password baru (kosongkan jika tidak ganti)" value={editForm.newPassword}
                  onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
                {error && <p className="text-xs text-red-500">{error}</p>}
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(s.id)} disabled={saving}
                    className="flex items-center gap-1 bg-brand text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                    <Check size={12} /> Simpan
                  </button>
                  <button onClick={() => setEditId(null)}
                    className="flex items-center gap-1 text-gray-500 px-3 py-1.5 rounded-lg text-xs border border-gray-200">
                    <X size={12} /> Batal
                  </button>
                </div>
              </div>
            ) : confirmDeleteId === s.id ? (
              <div className="px-4 py-3 space-y-2">
                <p className="text-sm font-semibold text-gray-900">
                  Hapus karyawan &ldquo;{s.name}&rdquo;?
                </p>
                {s.txCount > 0 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700 space-y-0.5">
                    <p className="font-semibold flex items-center gap-1">
                      <AlertTriangle size={11} /> Perhatian
                    </p>
                    <p>
                      {s.txCount} riwayat transaksi akan tetap tersimpan,
                      namun nama kasir akan dikosongkan.
                    </p>
                  </div>
                )}
                {deleteError && (
                  <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{deleteError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deleting}
                    className="flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                  >
                    <Trash2 size={12} /> {deleting ? "Menghapus..." : "Ya, Hapus"}
                  </button>
                  <button
                    onClick={() => { setConfirmDeleteId(null); setDeleteError(""); }}
                    className="flex items-center gap-1 text-gray-500 px-3 py-1.5 rounded-lg text-xs border border-gray-200"
                  >
                    <X size={12} /> Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className={`text-sm font-medium ${s.isActive ? "text-gray-900" : "text-gray-400"}`}>{s.name}</p>
                  <p className="text-xs text-gray-400">@{s.username} · {s.branch?.name ?? "—"}</p>
                </div>
                <button onClick={() => toggleActive(s)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    s.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
                  }`}>
                  {s.isActive ? "Aktif" : "Nonaktif"}
                </button>
                <button
                  onClick={() => { setEditId(s.id); setEditForm({ name: s.name, branchId: s.branchId ?? "", newPassword: "" }); setError(""); setConfirmDeleteId(null); }}
                  className="p-2 rounded-xl bg-gray-100 text-gray-600 active:bg-gray-200">
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => { setConfirmDeleteId(s.id); setDeleteError(""); setEditId(null); }}
                  className="p-2 rounded-xl bg-red-50 text-red-400 active:bg-red-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
