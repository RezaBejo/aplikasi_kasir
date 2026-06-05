"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import { formatRp } from "@/lib/format";

type TrendPoint = { date: string; total: number; count: number };
type BranchPoint = { name: string; total: number };

function formatK(val: number) {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}rb`;
  return String(val);
}

// Recharts formatter accepts ValueType | undefined
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fmtTooltip(val: any): [string, string] {
  return [formatRp(Number(val ?? 0)), "Penjualan"];
}

const tooltipStyle = {
  contentStyle: { fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb", padding: "6px 10px" },
  labelStyle: { fontSize: 11, color: "#374151", fontWeight: 600 },
};

export function TrendAreaChart({ data }: { data: TrendPoint[] }) {
  if (data.length < 2) return (
    <p className="text-center text-xs text-gray-300 py-6">Data belum cukup untuk grafik</p>
  );
  return (
    <ResponsiveContainer width="100%" height={130}>
      <AreaChart data={data} margin={{ top: 5, right: 4, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#111827" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#111827" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#9ca3af" }} />
        <YAxis tickFormatter={formatK} tick={{ fontSize: 9, fill: "#9ca3af" }} width={38} />
        <Tooltip {...tooltipStyle} formatter={fmtTooltip} />
        <Area
          type="monotone" dataKey="total"
          stroke="#111827" strokeWidth={2}
          fill="url(#grad)" dot={false} activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BranchBarChart({ data }: { data: BranchPoint[] }) {
  if (data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={Math.max(80, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
        <XAxis type="number" tickFormatter={formatK} tick={{ fontSize: 9, fill: "#9ca3af" }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#374151" }} width={72} />
        <Tooltip {...tooltipStyle} formatter={fmtTooltip} />
        <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === 0 ? "#111827" : "#d1d5db"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
