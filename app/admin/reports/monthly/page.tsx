"use client";

import Link from "next/link";
import { useState } from "react";

type BranchSummary = {
  branch: {
    id: number;
    name: string;
    code: string;
  };
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  percentage: number;
};

type StudentSummary = {
  studentId: number;
  hallTicket: string;
  name: string;
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
  totalDays: number;
  presentDays: number;
  absentDays: number;
  percentage: number;
};

type ReportDay = {
  academicDayId: number;
  date: string;
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
  session: {
    id: number;
    status: string;
    completedAt: string | null;
  };
  summary: {
    totalStudents: number;
    presentStudents: number;
    absentStudents: number;
  };
};

type MonthlyReport = {
  type: "MONTHLY";
  month: string;
  monthName: string;
  summary: {
    totalWorkingDays: number;
    completedAttendanceDays: number;
    pendingAttendanceDays: number;
    totalAttendanceRecords: number;
    presentRecords: number;
    absentRecords: number;
    percentage: number;
  };
  branches: BranchSummary[];
  students: StudentSummary[];
  days: ReportDay[];
};

type MonthlyReportResponse = {
  success: boolean;
  data?: {
    report: MonthlyReport;
  };
  message?: string;
};

export default function MonthlyAttendanceReportPage() {
  const [selectedMonth, setSelectedMonth] =
    useState(() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;
    });

  const [report, setReport] =
    useState<MonthlyReport | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  async function generateReport() {
    if (!selectedMonth) {
      setError("Please select a month.");
      setReport(null);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setReport(null);

      const response = await fetch(
        `/api/admin/reports/monthly?month=${encodeURIComponent(
          selectedMonth
        )}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const result: MonthlyReportResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {
        throw new Error(
          result.message ||
            "Unable to generate monthly report."
        );
      }

      setReport(result.data.report);
    } catch (err) {
      console.error(
        "Monthly report page error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate monthly report."
      );

      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatDateTime(
    value: string | null
  ) {
    if (!value) {
      return "N/A";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-IN");
  }

  function handlePrint() {
    window.print();
  }

  return (
    <main>
      <div>
        <Link href="/admin/reports">
          ← Back to Reports
        </Link>
      </div>

      <h1>Monthly Attendance Report</h1>

      <p>
        Generate the completed attendance report
        for a selected month.
      </p>

      <section>
        <h2>Select Month</h2>

        <label htmlFor="report-month">
          <strong>Month:</strong>
        </label>

        <br />

        <input
          id="report-month"
          type="month"
          value={selectedMonth}
          onChange={(event) => {
            setSelectedMonth(
              event.target.value
            );
            setError("");
          }}
        />

        {" "}

        <button
          type="button"
          onClick={generateReport}
          disabled={
            loading || !selectedMonth
          }
        >
          {loading
            ? "Generating..."
            : "Generate Report"}
        </button>
      </section>

      {error && (
        <section>
          <p>{error}</p>
        </section>
      )}

      {report && (
        <section>
          <div>
            <h2>
              Monthly Attendance Report
            </h2>

            <button
              type="button"
              onClick={handlePrint}
            >
              Print Report
            </button>
          </div>

          <section>
            <h3>Report Information</h3>

            <p>
              <strong>Month:</strong>{" "}
              {report.monthName}
            </p>

            <p>
              <strong>Working Days:</strong>{" "}
              {report.summary.totalWorkingDays}
            </p>

            <p>
              <strong>
                Completed Attendance Days:
              </strong>{" "}
              {
                report.summary
                  .completedAttendanceDays
              }
            </p>

            <p>
              <strong>
                Pending Attendance Days:
              </strong>{" "}
              {
                report.summary
                  .pendingAttendanceDays
              }
            </p>
          </section>

          <section>
            <h3>Overall Summary</h3>

            <p>
              <strong>
                Total Attendance Records:
              </strong>{" "}
              {
                report.summary
                  .totalAttendanceRecords
              }
            </p>

            <p>
              <strong>Present:</strong>{" "}
              {report.summary.presentRecords}
            </p>

            <p>
              <strong>Absent:</strong>{" "}
              {report.summary.absentRecords}
            </p>

            <p>
              <strong>
                Attendance Percentage:
              </strong>{" "}
              {Math.min(
                100,
                Math.max(
                  0,
                  report.summary.percentage
                )
              ).toFixed(2)}
              %
            </p>
          </section>

          <section>
            <h3>Branch-wise Summary</h3>

            {report.branches.length === 0 ? (
              <p>
                No completed attendance records
                found for this month.
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Branch</th>
                    <th>Code</th>
                    <th>Attendance Records</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Percentage</th>
                  </tr>
                </thead>

                <tbody>
                  {report.branches.map(
                    (branch, index) => (
                      <tr key={branch.branch.id}>
                        <td>{index + 1}</td>
                        <td>
                          {branch.branch.name}
                        </td>
                        <td>
                          {branch.branch.code}
                        </td>
                        <td>
                          {branch.totalStudents}
                        </td>
                        <td>
                          {branch.presentStudents}
                        </td>
                        <td>
                          {branch.absentStudents}
                        </td>
                        <td>
                          {branch.percentage.toFixed(
                            2
                          )}
                          %
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}
          </section>

          <section>
            <h3>Student-wise Summary</h3>

            {report.students.length === 0 ? (
              <p>
                No completed student attendance
                records found.
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Hall Ticket</th>
                    <th>Name</th>
                    <th>Branch</th>
                    <th>Study Year</th>
                    <th>Total Days</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Percentage</th>
                  </tr>
                </thead>

                <tbody>
                  {report.students.map(
                    (student, index) => (
                      <tr
                        key={student.studentId}
                      >
                        <td>{index + 1}</td>
                        <td>
                          {student.hallTicket}
                        </td>
                        <td>{student.name}</td>
                        <td>
                          {student.branch.name}
                        </td>
                        <td>
                          {student.studyYear.name}
                        </td>
                        <td>
                          {student.totalDays}
                        </td>
                        <td>
                          {student.presentDays}
                        </td>
                        <td>
                          {student.absentDays}
                        </td>
                        <td>
                          {student.percentage.toFixed(
                            2
                          )}
                          %
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}
          </section>

          <section>
            <h3>Completed Attendance Days</h3>

            {report.days.length === 0 ? (
              <p>
                No completed working attendance
                days found for this month.
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Date</th>
                    <th>Branch</th>
                    <th>Study Year</th>
                    <th>Semester</th>
                    <th>Status</th>
                    <th>Total Students</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Completed At</th>
                  </tr>
                </thead>

                <tbody>
                  {report.days.map(
                    (day, index) => (
                      <tr
                        key={`${day.session.id}-${day.branch.id}`}
                      >
                        <td>{index + 1}</td>
                        <td>
                          {formatDate(day.date)}
                        </td>
                        <td>
                          {day.branch.name}
                        </td>
                        <td>
                          {day.studyYear.name}
                        </td>
                        <td>
                          {day.semester.name}
                        </td>
                        <td>
                          {day.session.status}
                        </td>
                        <td>
                          {
                            day.summary
                              .totalStudents
                          }
                        </td>
                        <td>
                          {
                            day.summary
                              .presentStudents
                          }
                        </td>
                        <td>
                          {
                            day.summary
                              .absentStudents
                          }
                        </td>
                        <td>
                          {formatDateTime(
                            day.session
                              .completedAt
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}
          </section>
        </section>
      )}
    </main>
  );
}
