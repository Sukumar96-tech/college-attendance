"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type AttendanceStatus =
  | "UNMARKED"
  | "PRESENT"
  | "ABSENT";

type StudentAttendance = {
  attendanceId: number;
  studentId: number;
  hallTicket: string;
  name: string;
  studyYear: {
    id: number;
    name: string;
    number: number;
  };
  status: AttendanceStatus;

  branch: {
    id: number;
    name: string;
    code: string;
  };
};

type AttendanceSession = {
  id: number;

  status: "DRAFT" | "COMPLETED";

  completedAt: string | null;

  academicDay: {
    id: number;
    date: string;
    type: "WORKING_DAY" | "HOLIDAY";
    remarks: string | null;
  };

  semester: {
    id: number;
    name: string;
    number: number;
  };

  studyYear: {
    id: number;
    name: string;
    number: number;
  };

  branch: {
    id: number;
    name: string;
    code: string;
  };

  students: StudentAttendance[];
};

export default function AttendanceDetailsPage() {
  const params = useParams();

  const sessionId = params.sessionId;

  const [session, setSession] =
    useState<AttendanceSession | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [completing, setCompleting] =
    useState(false);

  const [bulkUpdating, setBulkUpdating] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  /*
   * Load attendance session
   */
  async function loadSession() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/attendance/${sessionId}`,
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
        setError(
          result.message ||
            "Unable to load attendance."
        );

        return;
      }

      setSession(result.data);
    } catch (error) {
      console.error(
        "Attendance loading error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  /*
   * Individual Present / Absent
   */
  async function updateStudentStatus(
    attendanceId: number,
    status: "PRESENT" | "ABSENT"
  ) {
    if (!session) {
      return;
    }

    if (session.status === "COMPLETED") {
      return;
    }

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/admin/attendance/${sessionId}/records`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            attendanceId,
            status,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        setError(
          result.message ||
            "Unable to update attendance."
        );

        return;
      }

      setSession((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,

          students:
            current.students.map(
              (student) =>
                student.attendanceId ===
                attendanceId
                  ? {
                      ...student,
                      status,
                    }
                  : student
            ),
        };
      });
    } catch (error) {
      console.error(
        "Individual attendance update error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    }
  }

  /*
   * Present All / Absent All
   */
  async function markAll(
    status: "PRESENT" | "ABSENT"
  ) {
    if (!session) {
      return;
    }

    if (session.status === "COMPLETED") {
      return;
    }

    const confirmed =
      window.confirm(
        status === "PRESENT"
          ? "Are you sure you want to mark all students as PRESENT?"
          : "Are you sure you want to mark all students as ABSENT?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setBulkUpdating(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/admin/attendance/${sessionId}/bulk`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            status,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        setError(
          result.message ||
            "Unable to update attendance."
        );

        return;
      }

      setSession((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,

          students:
            current.students.map(
              (student) => ({
                ...student,
                status,
              })
            ),
        };
      });

      setMessage(
        result.message ||
          "Attendance updated successfully."
      );
    } catch (error) {
      console.error(
        "Bulk attendance error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setBulkUpdating(false);
    }
  }

  /*
   * Save Draft
   */
  async function saveDraft() {
    if (!session) {
      return;
    }

    if (session.status === "COMPLETED") {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/admin/attendance/${sessionId}/save`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            attendance:
              session.students.map(
                (student) => ({
                  studentId:
                    student.studentId,

                  status:
                    student.status,
                })
              ),
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        setError(
          result.message ||
            "Unable to save draft."
        );

        return;
      }

      setMessage(
        result.message ||
          "Attendance draft saved successfully."
      );
    } catch (error) {
      console.error(
        "Save draft error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * Complete Attendance
   */
  async function completeAttendance() {
    if (!session) {
      return;
    }

    if (session.status === "COMPLETED") {
      return;
    }

    const unmarkedCount =
      session.students.filter(
        (student) =>
          student.status ===
          "UNMARKED"
      ).length;

    if (unmarkedCount > 0) {
      setError(
        `Please mark all students before completing attendance. ${unmarkedCount} student(s) are still unmarked.`
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to complete attendance? Once completed, it cannot be edited."
      );

    if (!confirmed) {
      return;
    }

    try {
      setCompleting(true);
      setError("");
      setMessage("");

      /*
       * Save the latest attendance state first.
       */
      const saveResponse =
        await fetch(
          `/api/admin/attendance/${sessionId}/save`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              attendance:
                session.students.map(
                  (student) => ({
                    studentId:
                      student.studentId,

                    status:
                      student.status,
                  })
                ),
            }),
          }
        );

      const saveResult =
        await saveResponse.json();

      if (
        !saveResponse.ok ||
        !saveResult.success
      ) {
        setError(
          saveResult.message ||
            "Unable to save attendance before completion."
        );

        return;
      }

      /*
       * Complete the session.
       */
      const response =
        await fetch(
          `/api/admin/attendance/${sessionId}/complete`,
          {
            method: "PATCH",
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        setError(
          result.message ||
            "Unable to complete attendance."
        );

        return;
      }

      setSession((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,

          status: "COMPLETED",

          completedAt:
            result.data.completedAt,
        };
      });

      setMessage(
        result.message ||
          "Attendance completed successfully and locked."
      );
    } catch (error) {
      console.error(
        "Complete attendance error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setCompleting(false);
    }
  }

  /*
   * Format date
   */
  function formatDate(
    value: string
  ) {
    return new Date(
      value
    ).toLocaleDateString();
  }

  /*
   * Loading state
   */
  if (loading) {
    return (
      <main>
        <p>
          Loading attendance...
        </p>
      </main>
    );
  }

  /*
   * Error state
   */
  if (error && !session) {
    return (
      <main>
        <h1>
          Attendance
        </h1>

        <p>{error}</p>

        <Link href="/admin/attendance">
          ← Back to Attendance
        </Link>
      </main>
    );
  }

  /*
   * Session not found
   */
  if (!session) {
    return (
      <main>
        <h1>
          Attendance
        </h1>

        <p>
          Attendance session not
          found.
        </p>

        <Link href="/admin/attendance">
          ← Back to Attendance
        </Link>
      </main>
    );
  }

  /*
   * Summary counts
   */
  const totalStudents =
    session.students.length;

  const presentCount =
    session.students.filter(
      (student) =>
        student.status === "PRESENT"
    ).length;

  const absentCount =
    session.students.filter(
      (student) =>
        student.status === "ABSENT"
    ).length;

  const unmarkedCount =
    session.students.filter(
      (student) =>
        student.status === "UNMARKED"
    ).length;

  const isCompleted =
    session.status === "COMPLETED";

  return (
    <main>
      {/* Back navigation */}

      <div>
        <Link href="/admin/attendance">
          ← Back to Attendance
        </Link>
      </div>

      {/* Page heading */}

      <h1>
        Daily Attendance
      </h1>

      {/* Messages */}

      {error && (
        <p>
          {error}
        </p>
      )}

      {message && (
        <p>
          {message}
        </p>
      )}

      {/* Attendance information */}

      <section>
        <h2>
          Attendance Information
        </h2>

        <p>
          <strong>
            Date:
          </strong>{" "}
          {formatDate(
            session.academicDay.date
          )}
        </p>

        <p>
          <strong>
            Study Year:
          </strong>{" "}
          {session.studyYear.name}
        </p>

        <p>
          <strong>
            Branch:
          </strong>{" "}
          {session.branch.name} ({session.branch.code})
        </p>

        <p>
          <strong>
            Semester:
          </strong>{" "}
          {session.semester.name}
        </p>

        <p>
          <strong>
            Day Type:
          </strong>{" "}
          {session.academicDay.type}
        </p>

        <p>
          <strong>
            Status:
          </strong>{" "}
          {isCompleted
            ? "🔒 COMPLETED"
            : "📝 DRAFT"}
        </p>

        {session.academicDay
          .remarks && (
          <p>
            <strong>
              Remarks:
            </strong>{" "}
            {
              session.academicDay
                .remarks
            }
          </p>
        )}

        {isCompleted &&
          session.completedAt && (
            <p>
              <strong>
                Completed At:
              </strong>{" "}
              {new Date(
                session.completedAt
              ).toLocaleString()}
            </p>
          )}
      </section>

      {/* Summary */}

      <section>
        <h2>
          Attendance Summary
        </h2>

        <p>
          <strong>
            Total Students:
          </strong>{" "}
          {totalStudents}
        </p>

        <p>
          <strong>
            Present:
          </strong>{" "}
          {presentCount}
        </p>

        <p>
          <strong>
            Absent:
          </strong>{" "}
          {absentCount}
        </p>

        <p>
          <strong>
            Unmarked:
          </strong>{" "}
          {unmarkedCount}
        </p>
      </section>

      {/* Attendance controls */}

      {!isCompleted && (
        <section>
          <h2>
            Attendance Controls
          </h2>

          <button
            type="button"
            disabled={bulkUpdating}
            onClick={() =>
              markAll("PRESENT")
            }
          >
            {bulkUpdating
              ? "Updating..."
              : "Present All"}
          </button>

          <button
            type="button"
            disabled={bulkUpdating}
            onClick={() =>
              markAll("ABSENT")
            }
          >
            {bulkUpdating
              ? "Updating..."
              : "Absent All"}
          </button>

          <button
            type="button"
            disabled={
              saving ||
              completing
            }
            onClick={saveDraft}
          >
            {saving
              ? "Saving..."
              : "Save Draft"}
          </button>

          <button
            type="button"
            disabled={
              completing ||
              saving ||
              unmarkedCount > 0
            }
            onClick={
              completeAttendance
            }
          >
            {completing
              ? "Completing..."
              : "Complete Attendance"}
          </button>
        </section>
      )}

      {/* Completion warning */}

      {!isCompleted &&
        unmarkedCount > 0 && (
          <section>
            <p>
              ⚠️ {unmarkedCount}{" "}
              student(s) are still
              unmarked. You must mark
              every student before
              completing attendance.
            </p>
          </section>
        )}

      {/* Locked message */}

      {isCompleted && (
        <section>
          <p>
            🔒 This attendance session
            is completed and locked.
          </p>

          <p>
            No attendance changes
            are allowed.
          </p>
        </section>
      )}

      {/* Student attendance table */}

      <section>
        <h2>
          Student Attendance
        </h2>

        {session.students.length ===
        0 ? (
          <p>
            No students found in
            this attendance session.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>
                  #
                </th>

                <th>
                  Hall Ticket
                </th>

                <th>
                  Student Name
                </th>

                <th>
                  Study Year
                </th>

                <th>
                  Status
                </th>

                <th>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {session.students.map(
                (
                  student,
                  index
                ) => (
                  <tr
                    key={
                      student.attendanceId
                    }
                  >
                    <td>
                      {index + 1}
                    </td>

                    <td>
                      {
                        student.hallTicket
                      }
                    </td>

                    <td>
                      {student.name}
                    </td>

                    <td>
                      {student.studyYear.name}
                    </td>

                    <td>
                      {student.status}
                    </td>

                    <td>
                      {!isCompleted && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              updateStudentStatus(
                                student.attendanceId,
                                "PRESENT"
                              )
                            }
                          >
                            Present
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              updateStudentStatus(
                                student.attendanceId,
                                "ABSENT"
                              )
                            }
                          >
                            Absent
                          </button>
                        </>
                      )}

                      {isCompleted && (
                        <span>
                          🔒 Locked
                        </span>
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}