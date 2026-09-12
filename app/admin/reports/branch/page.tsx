"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Branch = {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
};

type AcademicYear = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
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
    academicYear: string;
  };
};

type BranchReport = {
  branch: Branch;

  academicYear: AcademicYear | null;

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

type BranchResponse = {
  success: boolean;
  data?: Branch[];
  message?: string;
};

type AcademicYearResponse = {
  success: boolean;
  data?: AcademicYear[];
  message?: string;
};

type ReportResponse = {
  success: boolean;
  data?: BranchReport;
  message?: string;
};

export default function BranchAttendanceReportPage() {
  const [branches, setBranches] =
    useState<Branch[]>([]);

  const [academicYears, setAcademicYears] =
    useState<AcademicYear[]>([]);

  const [branchId, setBranchId] =
    useState("");

  const [academicYearId, setAcademicYearId] =
    useState("");

  const [report, setReport] =
    useState<BranchReport | null>(
      null
    );

  const [loadingOptions, setLoadingOptions] =
    useState(true);

  const [loadingReport, setLoadingReport] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadOptions() {
      try {
        setLoadingOptions(true);
        setError("");

        const [
          branchesResponse,
          yearsResponse,
        ] = await Promise.all([
          fetch(
            "/api/admin/branches",
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          ),

          fetch(
            "/api/admin/academic-years",
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          ),
        ]);

        const branchesResult: BranchResponse =
          await branchesResponse.json();

        const yearsResult: AcademicYearResponse =
          await yearsResponse.json();

        if (
          !branchesResponse.ok ||
          !branchesResult.success
        ) {
          throw new Error(
            branchesResult.message ||
              "Unable to load branches."
          );
        }

        if (
          !yearsResponse.ok ||
          !yearsResult.success
        ) {
          throw new Error(
            yearsResult.message ||
              "Unable to load academic years."
          );
        }

        setBranches(
          branchesResult.data || []
        );

        setAcademicYears(
          yearsResult.data || []
        );
      } catch (err) {
        console.error(
          "Branch report options error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load report options."
        );
      } finally {
        setLoadingOptions(false);
      }
    }

    loadOptions();
  }, []);

  async function generateReport() {
    if (!branchId) {
      setError(
        "Please select a branch."
      );

      setReport(null);

      return;
    }

    try {
      setLoadingReport(true);
      setError("");
      setReport(null);

      const query =
        academicYearId
          ? `?branchId=${encodeURIComponent(
              branchId
            )}&academicYearId=${encodeURIComponent(
              academicYearId
            )}`
          : `?branchId=${encodeURIComponent(
              branchId
            )}`;

      const response = await fetch(
        `/api/admin/reports/branch${query}`,
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
            "Unable to generate branch report."
        );
      }

      setReport(
        result.data || null
      );
    } catch (err) {
      console.error(
        "Branch report error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate branch report."
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
        Branch-wise Attendance Report
      </h1>

      <p>
        View attendance statistics
        for a selected branch.
      </p>

      <p>
        <Link href="/admin/reports">
          ← Back to Reports
        </Link>
      </p>

      <section>
        <h2>
          Report Filters
        </h2>

        {loadingOptions ? (
          <p>
            Loading branches and
            academic years...
          </p>
        ) : (
          <>
            <div>
              <label htmlFor="branch">
                Branch:
              </label>

              <br />

              <select
                id="branch"
                value={branchId}
                onChange={(event) =>
                  setBranchId(
                    event.target.value
                  )
                }
              >
                <option value="">
                  Select Branch
                </option>

                {branches.map(
                  (branch) => (
                    <option
                      key={
                        branch.id
                      }
                      value={
                        branch.id
                      }
                    >
                      {branch.name} (
                      {branch.code})
                    </option>
                  )
                )}
              </select>
            </div>

            <br />

            <div>
              <label htmlFor="academic-year">
                Academic Year:
              </label>

              <br />

              <select
                id="academic-year"
                value={
                  academicYearId
                }
                onChange={(event) =>
                  setAcademicYearId(
                    event.target.value
                  )
                }
              >
                <option value="">
                  All Academic Years
                </option>

                {academicYears.map(
                  (year) => (
                    <option
                      key={
                        year.id
                      }
                      value={
                        year.id
                      }
                    >
                      {year.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <br />

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
              Branch Information
            </h2>

            <p>
              <strong>
                Branch:
              </strong>{" "}
              {report.branch.name}
            </p>

            <p>
              <strong>
                Code:
              </strong>{" "}
              {report.branch.code}
            </p>

            {report.academicYear && (
              <p>
                <strong>
                  Academic Year:
                </strong>{" "}
                {
                  report.academicYear
                    .name
                }
              </p>
            )}
          </section>

          <section>
            <h2>
              Branch Attendance
              Summary
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
                Total Students:
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
              Completed Working
              Days
            </h2>

            {report.workingDays
              .length === 0 ? (
              <p>
                No completed working
                days found.
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
                        key={
                          day.id
                        }
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
                          {
                            day.semester
                              .academicYear
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
              Student-wise Branch
              Attendance
            </h2>

            {report.students
              .length === 0 ? (
              <p>
                No active approved
                students found for
                this branch.
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
                      Academic Year
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
                              .academicYear
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