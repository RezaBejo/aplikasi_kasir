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
