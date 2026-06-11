import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import PosScreen from "./_components/pos-screen";

export default async function PosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Owner tanpa cabang diarahkan ke admin
  if (!session.user.branchId) redirect("/admin");

  const branch = await prisma.branch.findUnique({
    where: { id: session.user.branchId },
  });

  return (
    <PosScreen
      branchName={branch?.name ?? "Cabang"}
      cashierName={session.user.name}
    />
  );
}
