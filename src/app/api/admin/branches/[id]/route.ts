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
