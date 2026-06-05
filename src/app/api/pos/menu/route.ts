import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const branchId = session.user.branchId;
  if (!branchId) return NextResponse.json({ error: "No branch assigned" }, { status: 400 });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [menuItems, stocks] = await Promise.all([
    prisma.menuItem.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.dailyStock.findMany({
      where: { branchId, date: today },
    }),
  ]);

  const stockMap = new Map(stocks.map((s) => [s.menuItemId, s.remainingQty]));

  const result = menuItems.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    price: Number(item.price),
    imageUrl: item.imageUrl,
    remainingQty: stockMap.get(item.id) ?? 0,
    hasStock: stockMap.has(item.id),
  }));

  return NextResponse.json(result);
}
