import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const branches = await prisma.branch.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(branches);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, location } = await req.json();
  if (!name) return NextResponse.json({ error: "Nama cabang wajib diisi" }, { status: 400 });

  const branch = await prisma.branch.create({ data: { name, location: location || null } });
  return NextResponse.json(branch);
}
