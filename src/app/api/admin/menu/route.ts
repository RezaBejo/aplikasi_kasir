import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const items = await prisma.menuItem.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(items.map((i) => ({ ...i, price: Number(i.price) })));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, category, price, imageUrl } = await req.json();
  if (!name || !category || !price) {
    return NextResponse.json({ error: "name, category, price wajib diisi" }, { status: 400 });
  }

  const item = await prisma.menuItem.create({
    data: { name, category, price: Number(price), imageUrl: imageUrl || null },
  });

  return NextResponse.json({ ...item, price: Number(item.price) });
}
