import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AdminSettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "ADMIN") {
    redirect("/student/dashboard");
  }

  const admin = await db.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      id: true,
      username: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!admin) {
    redirect("/login");
  }

  return (
    <main>
      <h1>Admin Settings</h1>

      <section>
        <h2>Admin Account</h2>

        <p>
          <strong>Username:</strong>{" "}
          {admin.username}
        </p>

        <p>
          <strong>Role:</strong>{" "}
          {admin.role}
        </p>

        <p>
          <strong>Status:</strong>{" "}
          {admin.status}
        </p>

        <p>
          <strong>Account Created:</strong>{" "}
          {admin.createdAt.toLocaleDateString(
            "en-IN"
          )}
        </p>
      </section>

      <section>
        <h2>System Information</h2>

        <p>
          <strong>Application:</strong>{" "}
          College Attendance Management System
        </p>

        <p>
          <strong>Branch:</strong>{" "}
          AI &amp; ML
        </p>

        <p>
          <strong>Database:</strong>{" "}
          SQLite
        </p>

        <p>
          <strong>ORM:</strong>{" "}
          Prisma
        </p>

        <p>
          <strong>Authentication:</strong>{" "}
          Secure server-side session
        </p>
      </section>

      <section>
        <h2>Security</h2>

        <p>
          <Link href="/admin/settings/password">
            Change Password
          </Link>
        </p>
      </section>

      <section>
        <h2>Database Management</h2>

        <p>
          <Link href="/admin/settings/backup">
            Backup &amp; Restore
          </Link>
        </p>
      </section>

      <section>
        <h2>Administration</h2>

        <p>
          <Link href="/admin/dashboard">
            Back to Dashboard
          </Link>
        </p>
      </section>
    </main>
  );
}