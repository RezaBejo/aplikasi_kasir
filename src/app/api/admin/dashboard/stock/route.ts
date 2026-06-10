import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [branches, stocks] = await Promise.all([
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.dailyStock.findMany({
      where: { date: today },
      include: {
        menuItem: { select: { name: true } },
        branch: { select: { id: true } },
      },
      orderBy: { remainingQty: "asc" },
    }),
  ]);

  const result = branches.map((branch) => ({
    id: branch.id,
    name: branch.name,
    stockItems: stocks
      .filter((s) => s.branch.id === branch.id)
      .map((s) => ({
        id: s.id,
        menuName: s.menuItem.name,
        initialQty: s.initialQty,
        remainingQty: s.remainingQty,
      })),
  }));

  return NextResponse.json(result);
}
