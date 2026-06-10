import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, category, price, imageUrl, isActive } = body;

  const item = await prisma.menuItem.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(price !== undefined && { price: Number(price) }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json({ ...item, price: Number(item.price) });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    // Null out menu_item_id — transaction items already store name+price as snapshots
    await tx.$executeRaw`UPDATE transaction_items SET menu_item_id = NULL WHERE menu_item_id = ${params.id}`;
    // Delete daily stock records (operational data, not historical)
    await tx.dailyStock.deleteMany({ where: { menuItemId: params.id } });
    // Safe to delete now that all FK references are cleared
    await tx.menuItem.delete({ where: { id: params.id } });
  });

  return NextResponse.json({ ok: true });
}
