import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, branchId, isActive, newPassword } = body;

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(branchId !== undefined && { branchId }),
      ...(isActive !== undefined && { isActive }),
      ...(newPassword && { passwordHash: await hash(newPassword, 12) }),
    },
    include: { branch: { select: { name: true } } },
  });

  const { passwordHash: _, ...result } = user;
  return NextResponse.json(result);
}
