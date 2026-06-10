"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { appConfig } from "@/config/app";
import { useState } from "react";
import {
  LayoutDashboard,
  BarChart2,
  Package,
  UtensilsCrossed,
  Store,
  Users,
  LogOut,
  KeyRound,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/stock", label: "Stok", icon: Package },
  { href: "/admin/reports", label: "Laporan", icon: BarChart2 },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/staff", label: "Karyawan", icon: Users },
  { href: "/admin/branches", label: "Cabang", icon: Store },
];

export default function AdminNav({ ownerName }: { ownerName: string }) {
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const openModal = () => {
    setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    setError(""); setSuccess(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) { setError("Semua field wajib diisi"); return; }
    if (newPwd !== confirmPwd) { setError("Konfirmasi password tidak cocok"); return; }
    if (newPwd.length < 6) { setError("Password baru minimal 6 karakter"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/admin/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
    });
    setSaving(false);
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => setShowModal(false), 1500);
    } else {
      const d = await res.json();
      setError(d.error ?? "Gagal menyimpan");
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-20 bg-white shadow-sm">
        {/* Top bar */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <button onClick={openModal} className="text-left group">
            <p className="font-bold text-gray-900 text-sm leading-tight">{appConfig.name}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1 group-hover:text-gray-600">
              {ownerName}
              <KeyRound size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={openModal}
              className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg active:bg-gray-200"
              title="Ganti Password"
            >
              <KeyRound size={13} />
              Password
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg active:bg-gray-200"
            >
              <LogOut size={13} />
              Keluar
            </button>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="px-3 py-2 flex gap-1 overflow-x-auto">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                  active ? "bg-brand text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Modal Ganti Password */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Ganti Password</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg bg-gray-100 text-gray-500">
                <X size={16} />
              </button>
            </div>

            {success ? (
              <p className="text-center text-emerald-600 font-semibold py-4">Password berhasil diubah!</p>
            ) : (
              <div className="space-y-3">
                {/* Current password */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Password Saat Ini</label>
                  <div className="relative">
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      placeholder="Masukkan password lama"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-2.5 text-gray-400">
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Password Baru</label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-2.5 text-gray-400">
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Konfirmasi Password Baru</label>
                  <input
                    type="password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>

                {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-brand text-white py-3 rounded-xl text-sm font-bold mt-1 disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Password"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
