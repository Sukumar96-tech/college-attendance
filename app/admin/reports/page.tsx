"use client";

import { useEffect, useMemo, useState } from "react";

type Branch = {
  id: number;
  name: string;
  code: string;
};

type Semester = {
  id: number;
  name: string;
  number: number;
  startDate: string;
  endDate: string;
};

type StudyYear = {
  id: number;
  name: string;
  number: number;
  semesters?: Semester[];
};

type MonthlyStudent = {
  studentId: number;
  hallTicket: string;
  name: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  percentage: number;
};

type MonthlyReport = {
  type: "MONTHLY";
  month: string;
  monthName: string;
  branch: Branch;
  studyYear: StudyYear;
  semester: Semester;
  summary: {
    totalWorkingDays: number;
    completedAttendanceDays: number;
    pendingAttendanceDays: number;
    totalAttendanceRecords: number;
    presentRecords: number;
    absentRecords: number;
    percentage: number;
  };
  students: MonthlyStudent[];
};

type SemesterReport = {
  type: "SEMESTER";
  branch: Branch;
  studyYear: StudyYear;
  semester: Semester;
  summary: {
    totalWorkingDays: number;
    completedAttendanceDays: number;
    pendingAttendanceDays: number;
    totalAttendanceRecords: number;
    presentRecords: number;
    absentRecords: number;
    percentage: number;
  };
  students: Array<{
    studentId: number;
    hallTicket: string;
    name: string;
    presentDays: number;
    absentDays: number;
    daysCounted: number;
    percentage: number;
  }>;
};

type ApiResponse<T> = {
  success: boolean;
  data?: {
    report: T;
  };
  message?: string;
};

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatPercentage(value: number) {
  return Math.min(100, Math.max(0, value)).toFixed(2);
}

function getCurrentMonth() {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
}

export default function ReportsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [studyYears, setStudyYears] = useState<StudyYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  const [selectedBranchId, setSelectedBranchId] =
    useState("");
  const [selectedStudyYearId, setSelectedStudyYearId] =
    useState("");
  const [selectedSemesterId, setSelectedSemesterId] =
    useState("");
  const [selectedMonth, setSelectedMonth] =
    useState(getCurrentMonth());

  const [loadingInitial, setLoadingInitial] =
    useState(true);
  const [loadingSemesters, setLoadingSemesters] =
    useState(false);

  const [monthlyLoading, setMonthlyLoading] =
    useState(false);
  const [semesterLoading, setSemesterLoading] =
    useState(false);

  const [monthlyReport, setMonthlyReport] =
    useState<MonthlyReport | null>(null);
  const [semesterReport, setSemesterReport] =
    useState<SemesterReport | null>(null);

  const [error, setError] = useState("");

  const selectedSemester = useMemo(
    () =>
      semesters.find(
        (semester) =>
          String(semester.id) ===
          selectedSemesterId
      ) ?? null,
    [semesters, selectedSemesterId]
  );

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoadingInitial(true);
      setError("");

      const [branchesResponse, studyYearsResponse] =
        await Promise.all([
          fetch("/api/admin/branches", {
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/admin/study-years", {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

      const branchesResult = await branchesResponse.json();
      const studyYearsResult =
        await studyYearsResponse.json();

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
        !studyYearsResponse.ok ||
        !studyYearsResult.success
      ) {
        throw new Error(
          studyYearsResult.message ||
            "Unable to load study years."
        );
      }

      const loadedBranches: Branch[] =
        branchesResult.data ?? [];
      const loadedStudyYears: StudyYear[] =
        studyYearsResult.data ?? [];

      setBranches(loadedBranches);
      setStudyYears(loadedStudyYears);

      if (loadedBranches.length > 0) {
        setSelectedBranchId(
          String(loadedBranches[0].id)
        );
      }

      if (loadedStudyYears.length > 0) {
        setSelectedStudyYearId(
          String(loadedStudyYears[0].id)
        );
      }
    } catch (err) {
      console.error(
        "Reports initial load error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load report options."
      );
    } finally {
      setLoadingInitial(false);
    }
  }

  useEffect(() => {
    if (!selectedStudyYearId) {
      setSemesters([]);
      setSelectedSemesterId("");
      return;
    }

    loadSemesters(selectedStudyYearId);
  }, [selectedStudyYearId]);

  async function loadSemesters(studyYearId: string) {
    try {
      setLoadingSemesters(true);
      setError("");
      setSemesters([]);
      setSelectedSemesterId("");
      setMonthlyReport(null);
      setSemesterReport(null);

      const response = await fetch(
        `/api/admin/semesters?studyYearId=${encodeURIComponent(
          studyYearId
        )}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to load semesters."
        );
      }

      const loadedSemesters: Semester[] =
        result.data ?? [];

      setSemesters(loadedSemesters);

      if (loadedSemesters.length > 0) {
        setSelectedSemesterId(
          String(loadedSemesters[0].id)
        );
      }
    } catch (err) {
      console.error(
        "Reports semester load error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load semesters."
      );
    } finally {
      setLoadingSemesters(false);
    }
  }

  function clearReports() {
    setMonthlyReport(null);
    setSemesterReport(null);
    setError("");
  }

  function hasValidSelection() {
    return Boolean(
      selectedBranchId &&
        selectedStudyYearId &&
        selectedSemesterId
    );
  }

  async function viewMonthlyReport() {
    if (!hasValidSelection()) {
      setError(
        "Please select Branch, Study Year, and Semester."
      );
      return;
    }

    if (!selectedMonth) {
      setError("Please select a month.");
      return;
    }

    try {
      setMonthlyLoading(true);
      setError("");
      setMonthlyReport(null);

      const params = new URLSearchParams({
        branchId: selectedBranchId,
        studyYearId: selectedStudyYearId,
        semesterId: selectedSemesterId,
        month: selectedMonth,
      });

      const response = await fetch(
        `/api/admin/reports/monthly?${params.toString()}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const result: ApiResponse<MonthlyReport> =
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

      setMonthlyReport(result.data.report);
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
    } finally {
      setMonthlyLoading(false);
    }
  }

  async function viewSemesterReport() {
    if (!hasValidSelection()) {
      setError(
        "Please select Branch, Study Year, and Semester."
      );
      return;
    }

    try {
      setSemesterLoading(true);
      setError("");
      setSemesterReport(null);

      const params = new URLSearchParams({
        branchId: selectedBranchId,
        studyYearId: selectedStudyYearId,
        semesterId: selectedSemesterId,
      });

      const response = await fetch(
        `/api/admin/reports/semester?${params.toString()}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const result: ApiResponse<SemesterReport> =
        await response.json();

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {
        throw new Error(
          result.message ||
            "Unable to generate semester report."
        );
      }

      setSemesterReport(result.data.report);
    } catch (err) {
      console.error(
        "Semester report page error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate semester report."
      );
    } finally {
      setSemesterLoading(false);
    }
  }

  function downloadMonthlyCsv() {
    if (!hasValidSelection() || !selectedMonth) {
      setError(
        "Please select Branch, Study Year, Semester, and Month."
      );
      return;
    }

    const params = new URLSearchParams({
      branchId: selectedBranchId,
      studyYearId: selectedStudyYearId,
      semesterId: selectedSemesterId,
      month: selectedMonth,
      download: "csv",
    });

    window.location.href =
      `/api/admin/reports/monthly?${params.toString()}`;
  }

  function downloadSemesterCsv() {
    if (!hasValidSelection()) {
      setError(
        "Please select Branch, Study Year, and Semester."
      );
      return;
    }

    const params = new URLSearchParams({
      branchId: selectedBranchId,
      studyYearId: selectedStudyYearId,
      semesterId: selectedSemesterId,
      download: "csv",
    });

    window.location.href =
      `/api/admin/reports/semester?${params.toString()}`;
  }

  function printMonthlyReport() {
    if (!monthlyReport) {
      setError(
        "Please view the monthly report before printing."
      );
      return;
    }

    window.print();
  }

  function printSemesterReport() {
    if (!semesterReport) {
      setError(
        "Please view the semester report before printing."
      );
      return;
    }

    window.print();
  }

  return (
    <main>
      <header>
        <h1>Attendance Reports</h1>
        <p>
          Select the branch, study year, and semester
          to generate monthly or complete semester
          attendance reports.
        </p>
      </header>

      {loadingInitial ? (
        <p>Loading report options...</p>
      ) : (
        <>
          <section>
            <h2>Report Selection</h2>

            <div>
              <label htmlFor="report-branch">
                <strong>Branch:</strong>
              </label>
              <br />
              <select
                id="report-branch"
                value={selectedBranchId}
                onChange={(event) => {
                  setSelectedBranchId(
                    event.target.value
                  );
                  clearReports();
                }}
              >
                <option value="">
                  Select Branch
                </option>

                {branches.map((branch) => (
                  <option
                    key={branch.id}
                    value={branch.id}
                  >
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </select>
            </div>

            <br />

            <div>
              <label htmlFor="report-study-year">
                <strong>Study Year:</strong>
              </label>
              <br />
              <select
                id="report-study-year"
                value={selectedStudyYearId}
                onChange={(event) => {
                  setSelectedStudyYearId(
                    event.target.value
                  );
                  clearReports();
                }}
              >
                <option value="">
                  Select Study Year
                </option>

                {studyYears.map((studyYear) => (
                  <option
                    key={studyYear.id}
                    value={studyYear.id}
                  >
                    {studyYear.name}
                  </option>
                ))}
              </select>
            </div>

            <br />

            <div>
              <label htmlFor="report-semester">
                <strong>Semester:</strong>
              </label>
              <br />
              <select
                id="report-semester"
                value={selectedSemesterId}
                onChange={(event) => {
                  setSelectedSemesterId(
                    event.target.value
                  );
                  clearReports();
                }}
                disabled={
                  loadingSemesters ||
                  !selectedStudyYearId
                }
              >
                <option value="">
                  {loadingSemesters
                    ? "Loading semesters..."
                    : "Select Semester"}
                </option>

                {semesters.map((semester) => (
                  <option
                    key={semester.id}
                    value={semester.id}
                  >
                    {semester.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedSemester && (
              <p>
                <strong>Semester Period:</strong>{" "}
                {formatDate(
                  selectedSemester.startDate
                )}{" "}
                -{" "}
                {formatDate(
                  selectedSemester.endDate
                )}
              </p>
            )}

            <button
              type="button"
              onClick={clearReports}
            >
              Clear Report Results
            </button>
          </section>

          {error && (
            <section>
              <p>{error}</p>
            </section>
          )}

          <hr />

          <section>
            <h2>Monthly Report</h2>

            <p>
              Generate an attendance report for a
              selected month within the configured
              semester period.
            </p>

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
                setMonthlyReport(null);
                setError("");
              }}
            />

            <div>
              <button
                type="button"
                onClick={viewMonthlyReport}
                disabled={
                  monthlyLoading ||
                  !hasValidSelection() ||
                  !selectedMonth
                }
              >
                {monthlyLoading
                  ? "Generating..."
                  : "View Monthly Report"}
              </button>

              <button
                type="button"
                onClick={downloadMonthlyCsv}
                disabled={
                  monthlyLoading ||
                  !hasValidSelection() ||
                  !selectedMonth
                }
              >
                Download Monthly CSV
              </button>

              <button
                type="button"
                onClick={printMonthlyReport}
                disabled={!monthlyReport}
              >
                Print Monthly Report
              </button>
            </div>
          </section>

          {monthlyReport && (
            <section>
              <h3>
                {monthlyReport.monthName} -{" "}
                {monthlyReport.branch.name} -{" "}
                {monthlyReport.studyYear.name} -{" "}
                {monthlyReport.semester.name}
              </h3>

              <p>
                <strong>Working Days:</strong>{" "}
                {
                  monthlyReport.summary
                    .totalWorkingDays
                }
              </p>

              <p>
                <strong>Completed Attendance:</strong>{" "}
                {
                  monthlyReport.summary
                    .completedAttendanceDays
                }
              </p>

              <p>
                <strong>Pending Attendance:</strong>{" "}
                {
                  monthlyReport.summary
                    .pendingAttendanceDays
                }
              </p>

              <p>
                <strong>Overall Percentage:</strong>{" "}
                {formatPercentage(
                  monthlyReport.summary
                    .percentage
                )}
                %
              </p>

              {monthlyReport.students.length ===
              0 ? (
                <p>
                  No active approved students found
                  for the selected branch and study
                  year.
                </p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Hall Ticket</th>
                      <th>Student</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Days Counted</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>

                  <tbody>
                    {monthlyReport.students.map(
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
                            {student.presentDays}
                          </td>
                          <td>
                            {student.absentDays}
                          </td>
                          <td>
                            {student.totalDays}
                          </td>
                          <td>
                            {formatPercentage(
                              student.percentage
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
          )}

          <hr />

          <section>
            <h2>Complete Semester Report</h2>

            <p>
              Generate the complete attendance
              report for the entire selected semester.
            </p>

            {selectedSemester && (
              <p>
                <strong>Selected Semester:</strong>{" "}
                {selectedSemester.name}
                {" | "}
                {formatDate(
                  selectedSemester.startDate
                )}{" "}
                -{" "}
                {formatDate(
                  selectedSemester.endDate
                )}
              </p>
            )}

            <div>
              <button
                type="button"
                onClick={viewSemesterReport}
                disabled={
                  semesterLoading ||
                  !hasValidSelection()
                }
              >
                {semesterLoading
                  ? "Generating..."
                  : "View Semester Report"}
              </button>

              <button
                type="button"
                onClick={downloadSemesterCsv}
                disabled={
                  semesterLoading ||
                  !hasValidSelection()
                }
              >
                Download Semester CSV
              </button>

              <button
                type="button"
                onClick={printSemesterReport}
                disabled={!semesterReport}
              >
                Print Semester Report
              </button>
            </div>
          </section>

          {semesterReport && (
            <section>
              <h3>
                Complete Semester Report
              </h3>

              <p>
                <strong>Branch:</strong>{" "}
                {semesterReport.branch.name}
              </p>

              <p>
                <strong>Study Year:</strong>{" "}
                {semesterReport.studyYear.name}
              </p>

              <p>
                <strong>Semester:</strong>{" "}
                {semesterReport.semester.name}
              </p>

              <p>
                <strong>Period:</strong>{" "}
                {formatDate(
                  semesterReport.semester
                    .startDate
                )}{" "}
                -{" "}
                {formatDate(
                  semesterReport.semester
                    .endDate
                )}
              </p>

              <p>
                <strong>Total Working Days:</strong>{" "}
                {
                  semesterReport.summary
                    .totalWorkingDays
                }
              </p>

              <p>
                <strong>Completed Attendance Days:</strong>{" "}
                {
                  semesterReport.summary
                    .completedAttendanceDays
                }
              </p>

              <p>
                <strong>Pending Attendance Days:</strong>{" "}
                {
                  semesterReport.summary
                    .pendingAttendanceDays
                }
              </p>

              <p>
                <strong>Overall Percentage:</strong>{" "}
                {formatPercentage(
                  semesterReport.summary
                    .percentage
                )}
                %
              </p>

              {semesterReport.students.length ===
              0 ? (
                <p>
                  No active approved students found
                  for the selected branch and study
                  year.
                </p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Hall Ticket</th>
                      <th>Student</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Days Counted</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>

                  <tbody>
                    {semesterReport.students.map(
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
                            {student.presentDays}
                          </td>
                          <td>
                            {student.absentDays}
                          </td>
                          <td>
                            {student.daysCounted}
                          </td>
                          <td>
                            {formatPercentage(
                              student.percentage
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
          )}
        </>
      )}
    </main>
  );
}
