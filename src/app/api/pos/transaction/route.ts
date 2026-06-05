import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type CartItem = {
  menuItemId: string;
  menuName: string;
  price: number;
  qty: number;
  lineTotal: number;
};

function generateCode(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TRX-${date}-${rand}`;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const branchId = session.user.branchId;
  if (!branchId) return NextResponse.json({ error: "No branch assigned" }, { status: 400 });

  const body = await req.json();
  const { items, discount = 0, paidAmount }: {
    items: CartItem[];
    discount: number;
    paidAmount: number;
  } = body;

  if (!items?.length) return NextResponse.json({ error: "Keranjang kosong" }, { status: 400 });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = Math.max(0, subtotal - discount);

  if (paidAmount < total) {
    return NextResponse.json({ error: "Jumlah bayar kurang" }, { status: 400 });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  try {
    const transaction = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const stock = await tx.dailyStock.findUnique({
          where: {
            branchId_menuItemId_date: {
              branchId,
              menuItemId: item.menuItemId,
              date: today,
            },
          },
        });

        if (!stock || stock.remainingQty < item.qty) {
          throw new Error(`Stok "${item.menuName}" tidak mencukupi`);
        }

        await tx.dailyStock.update({
          where: { id: stock.id },
          data: { remainingQty: { decrement: item.qty } },
        });
      }

      return tx.transaction.create({
        data: {
          code: generateCode(),
          branchId,
          cashierId: session.user.id,
          subtotal,
          discount,
          total,
          paidAmount,
          changeAmount: paidAmount - total,
          status: "COMPLETED",
          items: {
            create: items.map((item) => ({
              menuItemId: item.menuItemId,
              menuName: item.menuName,
              price: item.price,
              qty: item.qty,
              lineTotal: item.lineTotal,
            })),
          },
        },
        include: { items: true },
      });
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
