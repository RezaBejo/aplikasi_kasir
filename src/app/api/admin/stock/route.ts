import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");
  const dateStr = searchParams.get("date");

  if (!branchId || !dateStr) {
    return NextResponse.json({ error: "branchId and date required" }, { status: 400 });
  }

  const date = new Date(dateStr);
  date.setUTCHours(0, 0, 0, 0);

  const [menuItems, stocks] = await Promise.all([
    prisma.menuItem.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.dailyStock.findMany({ where: { branchId, date } }),
  ]);

  const stockMap = new Map(stocks.map((s) => [s.menuItemId, s]));

  return NextResponse.json(
    menuItems.map((item) => {
      const stock = stockMap.get(item.id);
      return {
        menuItemId: item.id,
        name: item.name,
        category: item.category,
        initialQty: stock?.initialQty ?? 0,
        remainingQty: stock?.remainingQty ?? 0,
        sold: stock ? stock.initialQty - stock.remainingQty : 0,
        hasStock: !!stock,
      };
    })
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { branchId, date: dateStr, items } = await req.json();
  if (!branchId || !dateStr || !Array.isArray(items)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const date = new Date(dateStr);
  date.setUTCHours(0, 0, 0, 0);

  // Read existing stocks to preserve sold qty
  const menuItemIds = items.map((i: { menuItemId: string }) => i.menuItemId);
  const existing = await prisma.dailyStock.findMany({
    where: { branchId, date, menuItemId: { in: menuItemIds } },
  });
  const existMap = new Map(existing.map((s) => [s.menuItemId, s]));

  await prisma.$transaction(
    items.map(({ menuItemId, qty }: { menuItemId: string; qty: number }) => {
      const ex = existMap.get(menuItemId);
      const sold = ex ? ex.initialQty - ex.remainingQty : 0;
      const newRemaining = Math.max(0, qty - sold);
      return prisma.dailyStock.upsert({
        where: { branchId_menuItemId_date: { branchId, menuItemId, date } },
        update: { initialQty: qty, remainingQty: newRemaining },
        create: { branchId, menuItemId, date, initialQty: qty, remainingQty: qty },
      });
    })
  );

  return NextResponse.json({ success: true });
}
