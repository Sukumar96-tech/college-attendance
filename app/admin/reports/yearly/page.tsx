"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AcademicYear = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

type StudentReport = {
  studentId: number;
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

  presentDays: number;
  absentDays: number;
  percentage: number;
};

type WorkingDay = {
  id: number;
  date: string;
  remarks: string | null;

  semester: {
    id: number;
    name: string;
    number: number;
  };
};

type YearlyReport = {
  academicYear: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };

  semesters: {
    id: number;
    name: string;
    number: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
  }[];

  summary: {
    completedWorkingDays: number;
    totalStudents: number;
    totalPresent: number;
    totalAbsent: number;
    overallPercentage: number;
  };

  workingDays: WorkingDay[];

  students: StudentReport[];
};

type AcademicYearsResponse = {
  success: boolean;
  data?: AcademicYear[];
  message?: string;
};

type ReportResponse = {
  success: boolean;
  data?: YearlyReport;
  message?: string;
};

export default function YearlyAttendanceReportPage() {
  const [academicYears, setAcademicYears] =
    useState<AcademicYear[]>([]);

  const [academicYearId, setAcademicYearId] =
    useState("");

  const [report, setReport] =
    useState<YearlyReport | null>(null);

  const [loadingYears, setLoadingYears] =
    useState(true);

  const [loadingReport, setLoadingReport] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadAcademicYears() {
      try {
        setLoadingYears(true);
        setError("");

        const response = await fetch(
          "/api/admin/academic-years",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const result: AcademicYearsResponse =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "Unable to load academic years."
          );
        }

        setAcademicYears(
          result.data || []
        );
      } catch (err) {
        console.error(
          "Academic years loading error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load academic years."
        );
      } finally {
        setLoadingYears(false);
      }
    }

    loadAcademicYears();
  }, []);

  async function generateReport() {
    if (!academicYearId) {
      setError(
        "Please select an academic year."
      );

      setReport(null);

      return;
    }

    try {
      setLoadingReport(true);
      setError("");
      setReport(null);

      const response = await fetch(
        `/api/admin/reports/yearly?academicYearId=${encodeURIComponent(
          academicYearId
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
            "Unable to generate year-wise report."
        );
      }

      setReport(
        result.data || null
      );
    } catch (err) {
      console.error(
        "Year-wise report error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate year-wise report."
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
        Year-wise Attendance Report
      </h1>

      <p>
        View attendance statistics for
        an academic year.
      </p>

      <p>
        <Link href="/admin/reports">
          ← Back to Reports
        </Link>
      </p>

      <section>
        <h2>
          Select Academic Year
        </h2>

        {loadingYears ? (
          <p>
            Loading academic years...
          </p>
        ) : (
          <>
            <label htmlFor="academic-year">
              Academic Year:
            </label>

            <br />

            <select
              id="academic-year"
              value={academicYearId}
              onChange={(event) =>
                setAcademicYearId(
                  event.target.value
                )
              }
            >
              <option value="">
                Select Academic Year
              </option>

              {academicYears.map(
                (academicYear) => (
                  <option
                    key={
                      academicYear.id
                    }
                    value={
                      academicYear.id
                    }
                  >
                    {academicYear.name}
                    {academicYear.isActive
                      ? " (Active)"
                      : ""}
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
              Academic Year Information
            </h2>

            <p>
              <strong>
                Academic Year:
              </strong>{" "}
              {
                report.academicYear
                  .name
              }
            </p>

            <p>
              <strong>
                Start Date:
              </strong>{" "}
              {formatDate(
                report.academicYear
                  .startDate
              )}
            </p>

            <p>
              <strong>
                End Date:
              </strong>{" "}
              {formatDate(
                report.academicYear
                  .endDate
              )}
            </p>
          </section>

          <section>
            <h2>Semesters</h2>

            {report.semesters
              .length === 0 ? (
              <p>
                No semesters found.
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>
                      Semester
                    </th>

                    <th>
                      Number
                    </th>

                    <th>
                      Start Date
                    </th>

                    <th>
                      End Date
                    </th>

                    <th>
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {report.semesters.map(
                    (semester) => (
                      <tr
                        key={
                          semester.id
                        }
                      >
                        <td>
                          {
                            semester.name
                          }
                        </td>

                        <td>
                          {
                            semester.number
                          }
                        </td>

                        <td>
                          {formatDate(
                            semester.startDate
                          )}
                        </td>

                        <td>
                          {formatDate(
                            semester.endDate
                          )}
                        </td>

                        <td>
                          {semester.isActive
                            ? "Active"
                            : "Inactive"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}
          </section>

          <section>
            <h2>
              Academic Year Summary
            </h2>

            <p>
              <strong>
                Completed Working Days:
              </strong>{" "}
              {
                report.summary
                  .completedWorkingDays
              }
            </p>

            <p>
              <strong>
                Active Students:
              </strong>{" "}
              {
                report.summary
                  .totalStudents
              }
            </p>

            <p>
              <strong>
                Total Present:
              </strong>{" "}
              {
                report.summary
                  .totalPresent
              }
            </p>

            <p>
              <strong>
                Total Absent:
              </strong>{" "}
              {
                report.summary
                  .totalAbsent
              }
            </p>

            <p>
              <strong>
                Overall Attendance:
              </strong>{" "}
              {Math.min(
                100,
                Math.max(
                  0,
                  report.summary
                    .overallPercentage
                )
              ).toFixed(2)}
              %
            </p>
          </section>

          <section>
            <h2>
              Completed Working Days
            </h2>

            {report.workingDays
              .length === 0 ? (
              <p>
                No completed working
                days found for this
                academic year.
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
                      Remarks
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {report.workingDays.map(
                    (
                      day,
                      index
                    ) => (
                      <tr
                        key={day.id}
                      >
                        <td>
                          {index +
                            1}
                        </td>

                        <td>
                          {formatDate(
                            day.date
                          )}
                        </td>

                        <td>
                          {
                            day.semester
                              .name
                          }
                        </td>

                        <td>
                          {day.remarks ||
                            "—"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}
          </section>

          <section>
            <h2>
              Student-wise Yearly
              Attendance
            </h2>

            {report.students
              .length === 0 ? (
              <p>
                No active approved
                students found for
                this academic year.
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>
                      S.No
                    </th>

                    <th>
                      Hall Ticket
                    </th>

                    <th>
                      Student Name
                    </th>

                    <th>
                      Branch
                    </th>

                    <th>
                      Year
                    </th>

                    <th>
                      Section
                    </th>

                    <th>
                      Present
                    </th>

                    <th>
                      Absent
                    </th>

                    <th>
                      Percentage
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {report.students.map(
                    (
                      student,
                      index
                    ) => (
                      <tr
                        key={
                          student.studentId
                        }
                      >
                        <td>
                          {index +
                            1}
                        </td>

                        <td>
                          {
                            student.hallTicket
                          }
                        </td>

                        <td>
                          {
                            student.name
                          }
                        </td>

                        <td>
                          {
                            student
                              .branch
                              .name
                          }
                        </td>

                        <td>
                          {
                            student.year
                          }
                        </td>

                        <td>
                          {student.section ||
                            "N/A"}
                        </td>

                        <td>
                          {
                            student.presentDays
                          }
                        </td>

                        <td>
                          {
                            student.absentDays
                          }
                        </td>

                        <td>
                          {Math.min(
                            100,
                            Math.max(
                              0,
                              student.percentage
                            )
                          ).toFixed(2)}
                          %
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