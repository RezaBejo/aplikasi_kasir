"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  BarChart2,
  Package,
  UtensilsCrossed,
  Store,
  Users,
  LogOut,
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

  return (
    <div className="fixed top-0 left-0 right-0 z-20 bg-white shadow-sm">
      {/* Top bar */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <div>
          <p className="font-bold text-gray-900 text-sm leading-tight">POS Gerobak</p>
          <p className="text-xs text-gray-400">{ownerName}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg active:bg-gray-200"
        >
          <LogOut size={13} />
          Keluar
        </button>
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
                active
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <Icon size={14} />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
