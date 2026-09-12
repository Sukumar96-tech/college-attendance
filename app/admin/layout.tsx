import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "ADMIN") {
    redirect("/student/dashboard");
  }

  return (
    <div>
      <AdminSidebar />

      <main>{children}</main>
    </div>
  );
}