import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Branches ──
  const branchA = await prisma.branch.upsert({
    where: { id: "branch-gerobak-a" },
    update: {},
    create: { id: "branch-gerobak-a", name: "Gerobak A", location: "Lokasi A", isActive: true },
  });

  const branchB = await prisma.branch.upsert({
    where: { id: "branch-gerobak-b" },
    update: {},
    create: { id: "branch-gerobak-b", name: "Gerobak B", location: "Lokasi B", isActive: true },
  });

  // ── Users ──
  await prisma.user.upsert({
    where: { username: "owner" },
    update: {},
    create: {
      name: "Owner",
      username: "owner",
      passwordHash: await hash("owner123", 12),
      role: Role.OWNER,
      branchId: null,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { username: "kasir_a" },
    update: {},
    create: {
      name: "Kasir Gerobak A",
      username: "kasir_a",
      passwordHash: await hash("kasir123", 12),
      role: Role.CASHIER,
      branchId: branchA.id,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { username: "kasir_b" },
    update: {},
    create: {
      name: "Kasir Gerobak B",
      username: "kasir_b",
      passwordHash: await hash("kasir123", 12),
      role: Role.CASHIER,
      branchId: branchB.id,
      isActive: true,
    },
  });

  // ── Menu Items ──
  const menuData = [
    { id: "menu-siomay",    name: "Siomay",          category: "Dimsum", price: 5000 },
    { id: "menu-hakau",     name: "Hakau",            category: "Dimsum", price: 6000 },
    { id: "menu-lumpia",    name: "Lumpia Goreng",    category: "Dimsum", price: 5000 },
    { id: "menu-ceker",     name: "Ceker Dimsum",     category: "Dimsum", price: 7000 },
    { id: "menu-baso-aci",  name: "Baso Aci",         category: "Jajanan", price: 8000 },
    { id: "menu-cireng",    name: "Cireng Isi",       category: "Jajanan", price: 6000 },
    { id: "menu-es-teh",    name: "Es Teh Manis",     category: "Minuman", price: 4000 },
    { id: "menu-es-jeruk",  name: "Es Jeruk",         category: "Minuman", price: 5000 },
  ];

  const menus: Record<string, string> = {};
  for (const m of menuData) {
    const item = await prisma.menuItem.upsert({
      where: { id: m.id },
      update: {},
      create: { id: m.id, name: m.name, category: m.category, price: m.price, isActive: true },
    });
    menus[m.id] = item.id;
  }

  // ── Daily Stock (today) ──
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const stockData = [
    // Gerobak A
    { branchId: branchA.id, menuItemId: menus["menu-siomay"],   qty: 50 },
    { branchId: branchA.id, menuItemId: menus["menu-hakau"],    qty: 40 },
    { branchId: branchA.id, menuItemId: menus["menu-lumpia"],   qty: 30 },
    { branchId: branchA.id, menuItemId: menus["menu-ceker"],    qty: 25 },
    { branchId: branchA.id, menuItemId: menus["menu-baso-aci"], qty: 20 },
    { branchId: branchA.id, menuItemId: menus["menu-cireng"],   qty: 0  }, // habis
    { branchId: branchA.id, menuItemId: menus["menu-es-teh"],   qty: 99 },
    { branchId: branchA.id, menuItemId: menus["menu-es-jeruk"], qty: 99 },
    // Gerobak B
    { branchId: branchB.id, menuItemId: menus["menu-siomay"],   qty: 60 },
    { branchId: branchB.id, menuItemId: menus["menu-hakau"],    qty: 35 },
    { branchId: branchB.id, menuItemId: menus["menu-lumpia"],   qty: 20 },
    { branchId: branchB.id, menuItemId: menus["menu-ceker"],    qty: 30 },
    { branchId: branchB.id, menuItemId: menus["menu-baso-aci"], qty: 15 },
    { branchId: branchB.id, menuItemId: menus["menu-cireng"],   qty: 25 },
    { branchId: branchB.id, menuItemId: menus["menu-es-teh"],   qty: 99 },
    { branchId: branchB.id, menuItemId: menus["menu-es-jeruk"], qty: 99 },
  ];

  for (const s of stockData) {
    await prisma.dailyStock.upsert({
      where: {
        branchId_menuItemId_date: {
          branchId: s.branchId,
          menuItemId: s.menuItemId,
          date: today,
        },
      },
      update: {},
      create: {
        branchId: s.branchId,
        menuItemId: s.menuItemId,
        date: today,
        initialQty: s.qty,
        remainingQty: s.qty,
      },
    });
  }

  console.log("\n✅ Seed berhasil!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Akun:");
  console.log("  owner    / owner123  → Dashboard Owner (/admin)");
  console.log("  kasir_a  / kasir123  → POS Gerobak A (/pos)");
  console.log("  kasir_b  / kasir123  → POS Gerobak B (/pos)");
  console.log("Menu: 8 item · Stok hari ini sudah di-seed");
  console.log("  (Cireng Isi di Gerobak A = 0 → tampil 'Habis')");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
