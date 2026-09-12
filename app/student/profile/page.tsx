import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function StudentProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "STUDENT") {
    redirect("/admin/dashboard");
  }

  const user = await db.user.findUnique({
    where: {
      id: session.userId,
    },

    include: {
      student: {
        include: {
          branch: true,
          studyYear: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (
    user.status !== "APPROVED" ||
    !user.student ||
    !user.student.isActive
  ) {
    redirect("/login");
  }

  const student = user.student;

  return (
    <main>
      <div>
        <Link href="/student/dashboard">
          ← Back to Dashboard
        </Link>
      </div>

      <h1>My Profile</h1>

      <section>
        <h2>Personal Information</h2>

        <p>
          <strong>Name:</strong>{" "}
          {student.name}
        </p>

        <p>
          <strong>Email:</strong>{" "}
          {student.email || "Not provided"}
        </p>

        <p>
          <strong>Phone:</strong>{" "}
          {student.phone || "Not provided"}
        </p>
      </section>

      <section>
        <h2>Academic Information</h2>

        <p>
          <strong>Hall Ticket:</strong>{" "}
          {student.hallTicket}
        </p>

        <p>
          <strong>Branch:</strong>{" "}
          {student.branch.name}
        </p>

        <p>
          <strong>Branch Code:</strong>{" "}
          {student.branch.code}
        </p>

        <p>
          <strong>Study Year:</strong>{" "}
          {student.studyYear.name}
        </p>
      </section>

      <section>
        <h2>Account Information</h2>

        <p>
          <strong>Account Status:</strong>{" "}
          {user.status}
        </p>

        <p>
          <strong>Student Status:</strong>{" "}
          {student.isActive
            ? "Active"
            : "Inactive"}
        </p>
      </section>
    </main>
  );
}