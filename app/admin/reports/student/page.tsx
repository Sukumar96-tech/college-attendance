"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Student = {
  id: number;
  hallTicket: string;
  name: string;
  branch: {
    id: number;
    name: string;
    code: string;
  };
  academicYear: {
    id: number;
    name: string;
  };
  year: string;
  section: string | null;
  isActive: boolean;
};

type StudentReport = {
  student: {
    id: number;
    hallTicket: string;
    name: string;
    email: string | null;
    phone: string | null;

    branch: {
      id: number;
      name: string;
      code: string;
    };

    academicYear: {
      id: number;
      name: string;
      startDate: string;
      endDate: string;
    };

    year: string;
    section: string | null;
    isActive: boolean;
    accountStatus:
      | "PENDING"
      | "APPROVED"
      | "REJECTED";
  };

  summary: {
    totalWorkingDays: number;
    presentDays: number;
    absentDays: number;
    percentage: number;
  };

  records: {
    attendanceId: number;
    sessionId: number;
    date: string;
    status: "PRESENT" | "ABSENT";
    remarks: string | null;

    semester: {
      id: number;
      name: string;
      number: number;
      academicYear: string;
    };
  }[];
};

type StudentsResponse = {
  success: boolean;
  data?: Student[];
  message?: string;
};

type ReportResponse = {
  success: boolean;
  data?: StudentReport;
  message?: string;
};

export default function StudentAttendanceReportPage() {
  const [students, setStudents] =
    useState<Student[]>([]);

  const [studentId, setStudentId] =
    useState("");

  const [report, setReport] =
    useState<StudentReport | null>(
      null
    );

  const [loadingStudents, setLoadingStudents] =
    useState(true);

  const [loadingReport, setLoadingReport] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadStudents() {
      try {
        setLoadingStudents(true);
        setError("");

        const response = await fetch(
          "/api/admin/students",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const result: StudentsResponse =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "Unable to load students."
          );
        }

        const activeStudents =
          (result.data || []).filter(
            (student) =>
              student.isActive
          );

        setStudents(
          activeStudents
        );
      } catch (err) {
        console.error(
          "Student report students error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load students."
        );
      } finally {
        setLoadingStudents(false);
      }
    }

    loadStudents();
  }, []);

  async function generateReport() {
    if (!studentId) {
      setError(
        "Please select a student."
      );

      setReport(null);

      return;
    }

    try {
      setLoadingReport(true);
      setError("");
      setReport(null);

      const response = await fetch(
        `/api/admin/reports/student?studentId=${encodeURIComponent(
          studentId
        )}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const result: ReportResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Unable to generate student report."
        );
      }

      setReport(
        result.data || null
      );
    } catch (err) {
      console.error(
        "Student report error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate student report."
      );
    } finally {
      setLoadingReport(false);
    }
  }

  function formatDate(
    dateString: string
  ) {
    const date = new Date(
      dateString
    );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return dateString;
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  }

  return (
    <main>
      <h1>
        Student-wise Attendance Report
      </h1>

      <p>
        View the complete attendance
        history of an individual
        student.
      </p>

      <p>
        <Link href="/admin/reports">
          ← Back to Reports
        </Link>
      </p>

      <section>
        <h2>
          Select Student
        </h2>

        {loadingStudents ? (
          <p>
            Loading students...
          </p>
        ) : students.length === 0 ? (
          <p>
            No active students found.
          </p>
        ) : (
          <>
            <label htmlFor="student">
              Student:
            </label>

            <br />

            <select
              id="student"
              value={studentId}
              onChange={(event) =>
                setStudentId(
                  event.target.value
                )
              }
            >
              <option value="">
                Select Student
              </option>

              {students.map(
                (student) => (
                  <option
                    key={
                      student.id
                    }
                    value={
                      student.id
                    }
                  >
                    {
                      student.hallTicket
                    }{" "}
                    -{" "}
                    {student.name}
                  </option>
                )
              )}
            </select>

            {" "}

            <button
              type="button"
              onClick={
                generateReport
              }
              disabled={
                loadingReport
              }
            >
              {loadingReport
                ? "Generating..."
                : "Generate Report"}
            </button>
          </>
        )}
      </section>

      {error && (
        <section>
          <p>{error}</p>
        </section>
      )}

      {report && (
        <>
          <section>
            <h2>
              Student Information
            </h2>

            <p>
              <strong>
                Hall Ticket:
              </strong>{" "}
              {
                report.student
                  .hallTicket
              }
            </p>

            <p>
              <strong>
                Name:
              </strong>{" "}
              {report.student.name}
            </p>

            <p>
              <strong>
                Branch:
              </strong>{" "}
              {
                report.student
                  .branch.name
              }
            </p>

            <p>
              <strong>
                Branch Code:
              </strong>{" "}
              {
                report.student
                  .branch.code
              }
            </p>

            <p>
              <strong>
                Academic Year:
              </strong>{" "}
              {
                report.student
                  .academicYear.name
              }
            </p>

            <p>
              <strong>
                Year:
              </strong>{" "}
              {report.student.year}
            </p>

            <p>
              <strong>
                Section:
              </strong>{" "}
              {report.student.section ||
                "N/A"}
            </p>

            <p>
              <strong>
                Email:
              </strong>{" "}
              {report.student.email ||
                "N/A"}
            </p>

            <p>
              <strong>
                Phone:
              </strong>{" "}
              {report.student.phone ||
                "N/A"}
            </p>
          </section>

          <section>
            <h2>
              Attendance Summary
            </h2>

            <p>
              <strong>
                Completed Working Days:
              </strong>{" "}
              {
                report.summary
                  .totalWorkingDays
              }
            </p>

            <p>
              <strong>
                Present Days:
              </strong>{" "}
              {
                report.summary
                  .presentDays
              }
            </p>

            <p>
              <strong>
                Absent Days:
              </strong>{" "}
              {
                report.summary
                  .absentDays
              }
            </p>

            <p>
              <strong>
                Attendance Percentage:
              </strong>{" "}
              {Math.min(
                100,
                Math.max(
                  0,
                  report.summary
                    .percentage
                )
              ).toFixed(2)}
              %
            </p>
          </section>

          <section>
            <h2>
              Complete Attendance
              History
            </h2>

            {report.records
              .length === 0 ? (
              <p>
                No completed attendance
                records found for this
                student.
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>
                      S.No
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Semester
                    </th>

                    <th>
                      Academic Year
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Remarks
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {report.records.map(
                    (
                      record,
                      index
                    ) => (
                      <tr
                        key={
                          record.attendanceId
                        }
                      >
                        <td>
                          {index +
                            1}
                        </td>

                        <td>
                          {formatDate(
                            record.date
                          )}
                        </td>

                        <td>
                          {
                            record
                              .semester
                              .name
                          }
                        </td>

                        <td>
                          {
                            record
                              .semester
                              .academicYear
                          }
                        </td>

                        <td>
                          {record.status ===
                          "PRESENT"
                            ? "Present"
                            : "Absent"}
                        </td>

                        <td>
                          {record.remarks ||
                            "—"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </main>
  );
}