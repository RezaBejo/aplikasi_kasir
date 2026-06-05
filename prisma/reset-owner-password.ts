/**
 * Reset password owner via terminal:
 *   npx tsx prisma/reset-owner-password.ts <password-baru>
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const newPassword = process.argv[2];

  if (!newPassword) {
    console.error("Usage: npx tsx prisma/reset-owner-password.ts <password-baru>");
    process.exit(1);
  }

  if (newPassword.length < 6) {
    console.error("Password minimal 6 karakter");
    process.exit(1);
  }

  const owner = await prisma.user.findFirst({ where: { role: "OWNER" } });
  if (!owner) {
    console.error("Owner tidak ditemukan di database");
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: owner.id },
    data: { passwordHash: await hash(newPassword, 10) },
  });

  console.log(`Password owner "${owner.username}" berhasil direset.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
