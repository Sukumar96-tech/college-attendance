"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type StudentDetails = {
  id: number;
  hallTicket: string;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;

  branch: {
    id: number;
    name: string;
    code: string;
  };

  studyYear: {
    id: number;
    name: string;
    number: number;
  };

  account: {
    userId: number;
    username: string;
    role: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };

  createdAt: string;
  updatedAt: string;
};

export default function StudentDetailsPage() {
  const params = useParams();

  const studentId = params.studentId;

  const [student, setStudent] =
    useState<StudentDetails | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadStudent() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/students/${studentId}/details`,
        {
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Unable to load student."
        );
      }

      setStudent(result.data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load student details."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (studentId) {
      loadStudent();
    }
  }, [studentId]);

  if (loading) {
    return (
      <main>
        <p>
          Loading student details...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <h1>
          Student Details
        </h1>

        <p>{error}</p>

        <Link href="/admin/students">
          Back to Students
        </Link>
      </main>
    );
  }

  if (!student) {
    return (
      <main>
        <h1>
          Student Details
        </h1>

        <p>
          Student not found.
        </p>

        <Link href="/admin/students">
          Back to Students
        </Link>
      </main>
    );
  }

  return (
    <main>
      <div>
        <Link href="/admin/students">
          ← Back to Students
        </Link>
      </div>

      <h1>
        Student Details
      </h1>

      <section>
        <h2>
          Personal Information
        </h2>

        <p>
          <strong>Name:</strong>{" "}
          {student.name}
        </p>

        <p>
          <strong>Hall Ticket:</strong>{" "}
          {student.hallTicket}
        </p>

        <p>
          <strong>Email:</strong>{" "}
          {student.email ||
            "Not provided"}
        </p>

        <p>
          <strong>Phone:</strong>{" "}
          {student.phone ||
            "Not provided"}
        </p>
      </section>

      <section>
        <h2>
          Academic Information
        </h2>

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

        <p>
          <strong>Study Year Number:</strong>{" "}
          {student.studyYear.number}
        </p>
      </section>

      <section>
        <h2>
          Student Status
        </h2>

        <p>
          <strong>
            Student Status:
          </strong>{" "}
          {student.isActive
            ? "Active"
            : "Inactive"}
        </p>

        <p>
          <strong>
            Account Status:
          </strong>{" "}
          {student.account.status}
        </p>
      </section>

      <section>
        <h2>
          Account Information
        </h2>

        <p>
          <strong>
            Username:
          </strong>{" "}
          {student.account.username}
        </p>

        <p>
          <strong>
            Role:
          </strong>{" "}
          {student.account.role}
        </p>

        <p>
          <strong>
            Account Created:
          </strong>{" "}
          {new Date(
            student.account.createdAt
          ).toLocaleString()}
        </p>
      </section>

      <section>
        <Link
          href="/admin/students"
        >
          Manage Student
        </Link>
      </section>
    </main>
  );
}