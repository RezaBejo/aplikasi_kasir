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
  const { name, location, isActive } = body;

  const branch = await prisma.branch.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(location !== undefined && { location }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json(branch);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    // Null out FK on transactions so historical data is preserved
    await tx.$executeRaw`UPDATE transactions SET branch_id = NULL WHERE branch_id = ${params.id}`;
    // Release cashiers from this branch (branch_id already nullable on User)
    await tx.$executeRaw`UPDATE users SET branch_id = NULL WHERE branch_id = ${params.id}`;
    // Delete operational stock records
    await tx.dailyStock.deleteMany({ where: { branchId: params.id } });
    // Safe to delete now that all FK references are cleared
    await tx.branch.delete({ where: { id: params.id } });
  });

  return NextResponse.json({ ok: true });
}
