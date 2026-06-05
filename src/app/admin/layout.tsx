import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "./_components/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav ownerName={session.user.name} />
      {/* pt accounts for fixed header (~57px) + nav tabs (~48px) */}
      <div className="pt-[109px]">{children}</div>
    </div>
  );
}
