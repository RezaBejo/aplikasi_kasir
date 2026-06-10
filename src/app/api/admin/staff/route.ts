import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const staff = await prisma.user.findMany({
    where: { role: "CASHIER" },
    include: {
      branch: { select: { name: true } },
      _count: { select: { transactions: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    staff.map(({ passwordHash: _, _count, ...s }) => ({
      ...s,
      txCount: _count.transactions,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, username, password, branchId } = await req.json();
  if (!name || !username || !password || !branchId) {
    return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return NextResponse.json({ error: "Username sudah dipakai" }, { status: 409 });

  const user = await prisma.user.create({
    data: {
      name,
      username,
      passwordHash: await hash(password, 12),
      role: "CASHIER",
      branchId,
      isActive: true,
    },
    include: { branch: { select: { name: true } } },
  });

  const { passwordHash: _, ...result } = user;
  return NextResponse.json(result);
}
