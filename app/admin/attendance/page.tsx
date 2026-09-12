"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Branch = {
  id: number;
  name: string;
  code: string;
};

type StudyYear = {
  id: number;
  name: string;
  number: number;
};

type AcademicDay = {
  id: number;
  date: string;
  type: "WORKING_DAY" | "HOLIDAY";
  remarks: string | null;

  semester: {
    id: number;
    name: string;
    number: number;
    startDate: string;
    endDate: string;
  };

  studyYear: {
    id: number;
    name: string;
    number: number;
  };

  attendanceSession: {
    id: number;
    status: "DRAFT" | "COMPLETED";
    completedAt: string | null;
  } | null;
};

type AttendanceSession = {
  id: number;

  academicDay: {
    id: number;
    date: string;
    type: "WORKING_DAY" | "HOLIDAY";
    remarks: string | null;
  };

  branch: {
    id: number;
    name: string;
    code: string;
  };

  semester: {
    id: number;
    name: string;
    number: number;
    startDate: string;
    endDate: string;
  };

  studyYear: {
    id: number;
    name: string;
    number: number;
  };

  status: "DRAFT" | "COMPLETED";

  attendanceCount: number;

  completedAt: string | null;

  createdAt: string;
};

type AttendanceCreateResponse = {
  success: boolean;

  message?: string;

  data?: {
    id: number;
    sessionId?: number;
    status: "DRAFT" | "COMPLETED";

    academicDay: {
      id: number;
      date: string;
      type: "WORKING_DAY" | "HOLIDAY";
      remarks: string | null;
    };

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

    semester: {
      id: number;
      name: string;
      number: number;
      startDate: string;
      endDate: string;
    };

    students: {
      attendanceId: number;
      studentId: number;
      hallTicket: string;
      name: string;
      branch: {
        id: number;
        name: string;
        code: string;
      };
      status: "UNMARKED" | "PRESENT" | "ABSENT";
    }[];
  };
};

export default function AttendancePage() {
  const [branches, setBranches] =
    useState<Branch[]>([]);

  const [studyYears, setStudyYears] =
    useState<StudyYear[]>([]);

  const [semesters, setSemesters] =
    useState<Semester[]>([]);

  const [academicDays, setAcademicDays] =
    useState<AcademicDay[]>([]);

  const [sessions, setSessions] =
    useState<AttendanceSession[]>([]);

  const [branchId, setBranchId] =
    useState("");

  const [studyYearId, setStudyYearId] =
    useState("");

  const [semesterId, setSemesterId] =
    useState("");

  const [selectedAcademicDayId, setSelectedAcademicDayId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [loadingSemesters, setLoadingSemesters] =
    useState(false);

  const [loadingCalendar, setLoadingCalendar] =
    useState(false);

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  /*
   * Load branches.
   */
  async function loadBranches() {
    const response = await fetch(
      "/api/admin/branches",
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
          "Unable to load branches."
      );
    }

    const activeBranches =
      (result.data || []).filter(
        (branch: Branch) =>
          branch.id > 0
      );

    setBranches(activeBranches);

    if (
      activeBranches.length > 0 &&
      !branchId
    ) {
      setBranchId(
        String(activeBranches[0].id)
      );
    }
  }

  /*
   * Load study years and semesters.
   */
  async function loadStudyYears() {
    const response = await fetch(
      "/api/admin/study-years",
      { cache: "no-store" }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Unable to load study years."
      );
    }

    const years: StudyYear[] = (result.data || []).map(
      (studyYear: StudyYear) => ({
        id: studyYear.id,
        name: studyYear.name,
        number: studyYear.number,
      })
    );

    setStudyYears(years);

    if (years.length > 0 && !studyYearId) {
      setStudyYearId(String(years[0].id));
    }
  }

  /*
   * Load semesters directly for the selected study year.
   */
  async function loadSemesters(selectedStudyYearId: string) {
    if (!selectedStudyYearId) {
      setSemesters([]);
      setSemesterId("");
      setSelectedAcademicDayId("");
      return;
    }

    try {
      setLoadingSemesters(true);

      const response = await fetch(
        `/api/admin/semesters?studyYearId=${encodeURIComponent(selectedStudyYearId)}`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load semesters."
        );
      }

      const loadedSemesters: Semester[] = Array.isArray(result.data)
        ? result.data
        : [];

      loadedSemesters.sort((a, b) => a.number - b.number);
      setSemesters(loadedSemesters);

      if (loadedSemesters.length > 0) {
        setSemesterId(String(loadedSemesters[0].id));
      } else {
        setSemesterId("");
        setSelectedAcademicDayId("");
        setAcademicDays([]);
      }
    } catch (error) {
      console.error("Semester loading error:", error);
      setSemesters([]);
      setSemesterId("");
      setSelectedAcademicDayId("");
      setError(
        error instanceof Error ? error.message : "Unable to load semesters."
      );
    } finally {
      setLoadingSemesters(false);
    }
  }

  /*
   * Load academic calendar days.
   */
  async function loadAcademicDays() {
    try {
      setLoadingCalendar(true);

      const response = await fetch(
        "/api/admin/calendar",
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load academic calendar."
        );
      }

      setAcademicDays(
        Array.isArray(result.data) ? result.data : []
      );
    } catch (error) {
      console.error("Academic calendar loading error:", error);
      setAcademicDays([]);
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load academic calendar."
      );
    } finally {
      setLoadingCalendar(false);
    }
  }

  /*
   * Load attendance sessions.
   */
  async function loadSessions() {
    const response = await fetch(
      "/api/admin/attendance",
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
          "Unable to load attendance sessions."
      );
    }

    setSessions(result.data);
  }

  /*
   * Load all page data.
   */
  async function loadPage() {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        loadBranches(),
        loadStudyYears(),
        loadAcademicDays(),
        loadSessions(),
      ]);
    } catch (error) {
      console.error(
        "Attendance page loading error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load attendance."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(() => {
    if (!studyYearId) {
      setSemesters([]);
      setSemesterId("");
      setSelectedAcademicDayId("");
      return;
    }

    loadSemesters(studyYearId);
  }, [studyYearId]);

  useEffect(() => {
    if (!semesterId) {
      setSelectedAcademicDayId("");
      return;
    }

    loadAcademicDays();
    setSelectedAcademicDayId("");
  }, [semesterId]);

  /*
   * Selected study year.
   */
  const selectedStudyYear =
    studyYears.find(
      (studyYear) =>
        String(studyYear.id) ===
        studyYearId
    );

  /*
   * Selected semester.
   */
  const selectedSemester =
    semesters.find(
      (semester) => String(semester.id) === semesterId
    );

  /*
   * Academic days for selected
   * semester and study year.
   */
  const filteredAcademicDays =
    useMemo(() => {
      if (
        !semesterId ||
        !studyYearId
      ) {
        return [];
      }

      return academicDays
        .filter(
          (day) =>
            String(
              day.semester.id
            ) === semesterId &&
            String(
              day.studyYear.id
            ) === studyYearId
        )
        .sort(
          (a, b) =>
            new Date(
              b.date
            ).getTime() -
            new Date(
              a.date
            ).getTime()
        );
    }, [
      academicDays,
      semesterId,
      studyYearId,
    ]);

  /*
   * Sessions for selected semester,
   * study year and branch.
   */
  const filteredSessions =
    useMemo(() => {
      if (
        !semesterId ||
        !studyYearId ||
        !branchId
      ) {
        return [];
      }

      return sessions
        .filter(
          (session) =>
            String(
              session.semester.id
            ) === semesterId &&
            String(
              session.studyYear.id
            ) === studyYearId &&
            String(
              session.branch.id
            ) === branchId
        )
        .sort(
          (a, b) =>
            new Date(
              b.academicDay.date
            ).getTime() -
            new Date(
              a.academicDay.date
            ).getTime()
        );
    }, [
      sessions,
      semesterId,
      studyYearId,
      branchId,
    ]);

  /*
   * Only working days without an
   * existing session for the selected
   * branch can be started.
   */
  const availableWorkingDays =
    filteredAcademicDays.filter(
      (day) =>
        day.type ===
          "WORKING_DAY" &&
        !sessions.some(
          (session) =>
            session.academicDay.id ===
              day.id &&
            session.branch.id ===
              Number(branchId)
        )
    );

  /*
   * Selected academic day.
   */
  const selectedAcademicDay =
    filteredAcademicDays.find(
      (day) =>
        String(day.id) ===
        selectedAcademicDayId
    );

  /*
   * Change branch.
   */
  function handleBranchChange(
    value: string
  ) {
    setBranchId(value);

    setSelectedAcademicDayId("");

    setError("");
    setMessage("");
  }

  /*
   * Change study year.
   */
  function handleStudyYearChange(value: string) {
    setStudyYearId(value);
    setSemesters([]);
    setSemesterId("");
    setSelectedAcademicDayId("");
    setError("");
    setMessage("");
  }

  /*
   * Change semester.
   */
  function handleSemesterChange(
    value: string
  ) {
    setSemesterId(value);

    setSelectedAcademicDayId("");

    setError("");
    setMessage("");
  }

  /*
   * Start branch-specific attendance.
   *
   * The backend creates the session
   * and loads only students matching:
   *
   * Branch + Study Year
   */
  async function startAttendance() {
    if (!branchId) {
      setError(
        "Please select a branch."
      );
      return;
    }

    if (!studyYearId) {
      setError(
        "Please select a study year."
      );
      return;
    }

    if (!semesterId) {
      setError(
        "Please select a semester."
      );
      return;
    }

    if (!selectedAcademicDayId) {
      setError(
        "Please select a working day."
      );
      return;
    }

    if (!selectedAcademicDay) {
      setError(
        "Selected academic day was not found."
      );
      return;
    }

    if (
      selectedAcademicDay.type !==
      "WORKING_DAY"
    ) {
      setError(
        "Attendance can only be created for a working day."
      );
      return;
    }

    const selectedBranch =
      branches.find(
        (branch) =>
          String(branch.id) ===
          branchId
      );

    if (!selectedBranch) {
      setError(
        "Selected branch was not found."
      );
      return;
    }

    const selectedStudyYear =
      studyYears.find(
        (year) =>
          String(year.id) ===
          studyYearId
      );

    if (!selectedStudyYear) {
      setError(
        "Selected study year was not found."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Start attendance for ${selectedBranch.name} - ${selectedStudyYear.name} on ${formatDate(
          selectedAcademicDay.date
        )}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setCreating(true);
      setError("");
      setMessage("");

      const response =
        await fetch(
          "/api/admin/attendance",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              academicDayId:
                Number(
                  selectedAcademicDayId
                ),

              branchId:
                Number(branchId),
            }),
          }
        );

      const result: AttendanceCreateResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {
        setError(
          result.message ||
            "Unable to start attendance."
        );

        return;
      }

      /*
       * The backend has now loaded
       * the students for the selected
       * Branch + Study Year.
       *
       * Open the actual marking page.
       */
      window.location.href =
        `/admin/attendance/${result.data.id}`;
    } catch (error) {
      console.error(
        "Start attendance error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setCreating(false);
    }
  }

  /*
   * Format date.
   */
  function formatDate(
    value: string
  ) {
    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleDateString(
      "en-IN"
    );
  }

  /*
   * Format date range.
   */
  function formatDateRange(
    startDate: string,
    endDate: string
  ) {
    return `${formatDate(
      startDate
    )} - ${formatDate(
      endDate
    )}`;
  }

  /*
   * Loading screen.
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

  return (
    <main>
      <div>
        <Link href="/admin/dashboard">
          ← Back to Dashboard
        </Link>
      </div>

      <h1>
        Attendance Management
      </h1>

      <p>
        Select the branch and study
        year to load the students for
        attendance marking.
      </p>

      {error && (
        <section>
          <p>
            {error}
          </p>
        </section>
      )}

      {message && (
        <section>
          <p>
            {message}
          </p>
        </section>
      )}

      {/* =========================================
          ATTENDANCE SELECTION
          ========================================= */}

      <section>
        <h2>
          Start Attendance
        </h2>

        <p>
          First select the Branch,
          Study Year, Semester and
          Working Day. The system will
          then load only the students
          belonging to the selected
          Branch and Study Year.
        </p>

        {/* Branch */}

        <div>
          <label htmlFor="branch">
            <strong>
              Branch
            </strong>
          </label>

          <br />

          <select
            id="branch"
            value={branchId}
            onChange={(event) =>
              handleBranchChange(
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
                  key={branch.id}
                  value={branch.id}
                >
                  {branch.name}
                </option>
              )
            )}
          </select>
        </div>

        <br />

        {/* Study Year */}

        <div>
          <label htmlFor="studyYear">
            <strong>
              Study Year
            </strong>
          </label>

          <br />

          <select
            id="studyYear"
            value={studyYearId}
            onChange={(event) =>
              handleStudyYearChange(
                event.target.value
              )
            }
          >
            <option value="">
              Select Study Year
            </option>

            {studyYears.map(
              (studyYear) => (
                <option
                  key={studyYear.id}
                  value={studyYear.id}
                >
                  {studyYear.name}
                </option>
              )
            )}
          </select>
        </div>

        <br />

        {/* Semester */}

        <div>
          <label htmlFor="semester">
            <strong>
              Semester
            </strong>
          </label>

          <br />

          <select
            id="semester"
            value={semesterId}
            onChange={(event) =>
              handleSemesterChange(
                event.target.value
              )
            }
            disabled={
              semesters.length ===
              0
            }
          >
            <option value="">
              {loadingSemesters
                ? "Loading Semesters..."
                : "Select Semester"}
            </option>

            {semesters.map(
              (semester) => (
                <option
                  key={semester.id}
                  value={semester.id}
                >
                  {semester.name}
                  {" — "}
                  {formatDateRange(
                    semester.startDate,
                    semester.endDate
                  )}
                </option>
              )
            )}
          </select>
        </div>

        <br />

        {/* Working Day */}

        <div>
          <label htmlFor="attendanceDay">
            <strong>
              Attendance Date
            </strong>
          </label>

          <br />

          <select
            id="attendanceDay"
            value={
              selectedAcademicDayId
            }
            onChange={(event) =>
              setSelectedAcademicDayId(
                event.target.value
              )
            }
            disabled={
              !semesterId ||
              loadingCalendar ||
              availableWorkingDays.length === 0
            }
          >
            <option value="">
              {loadingCalendar
                ? "Loading Dates..."
                : "Select Working Day"}
            </option>

            {availableWorkingDays.map(
              (day) => (
                <option
                  key={day.id}
                  value={day.id}
                >
                  {formatDate(
                    day.date
                  )}

                  {day.remarks
                    ? ` — ${day.remarks}`
                    : ""}
                </option>
              )
            )}
          </select>
        </div>

        <br />

        {!branchId && (
          <p>
            Please select a branch.
          </p>
        )}

        {studyYearId &&
          !loadingSemesters &&
          semesters.length ===
            0 && (
            <p>
              No semesters have been
              configured for this study
              year.
            </p>
          )}

        {semesterId &&
          availableWorkingDays.length ===
            0 && (
            <p>
              No available working days
              are found for the selected
              semester and branch.
            </p>
          )}

        <br />

        <button
          type="button"
          disabled={
            creating ||
            !branchId ||
            !studyYearId ||
            !semesterId ||
            !selectedAcademicDayId
          }
          onClick={
            startAttendance
          }
        >
          {creating
            ? "Loading Students..."
            : "Load Students & Start Attendance"}
        </button>
      </section>

      {/* =========================================
          CURRENT SELECTION
          ========================================= */}

      {branchId &&
        studyYearId &&
        semesterId &&
        selectedAcademicDayId &&
        selectedAcademicDay && (
          <section>
            <h2>
              Selected Attendance
            </h2>

            <p>
              <strong>
                Branch:
              </strong>{" "}
              {
                branches.find(
                  (branch) =>
                    String(
                      branch.id
                    ) === branchId
                )?.name
              }
            </p>

            <p>
              <strong>
                Study Year:
              </strong>{" "}
              {
                selectedStudyYear?.name
              }
            </p>

            <p>
              <strong>
                Semester:
              </strong>{" "}
              {
                semesters.find(
                  (semester) =>
                    String(
                      semester.id
                    ) === semesterId
                )?.name
              }
            </p>

            <p>
              <strong>
                Date:
              </strong>{" "}
              {formatDate(
                selectedAcademicDay.date
              )}
            </p>
          </section>
        )}

      {/* =========================================
          CONFIGURED ACADEMIC DAYS
          ========================================= */}

      <section>
        <h2>
          Configured Academic Days
        </h2>

        {filteredAcademicDays.length ===
        0 ? (
          <p>
            No academic days have
            been configured for this
            semester.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>
                  Date
                </th>

                <th>
                  Type
                </th>

                <th>
                  Remarks
                </th>

                <th>
                  Selected Branch
                </th>

                <th>
                  Attendance
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredAcademicDays.map(
                (day) => {
                  const branchSession =
                    sessions.find(
                      (session) =>
                        session.academicDay
                          .id ===
                          day.id &&
                        session.branch
                          .id ===
                          Number(
                            branchId
                          )
                    );

                  return (
                    <tr
                      key={day.id}
                    >
                      <td>
                        {formatDate(
                          day.date
                        )}
                      </td>

                      <td>
                        {day.type ===
                        "WORKING_DAY"
                          ? "Working Day"
                          : "Holiday"}
                      </td>

                      <td>
                        {day.remarks ||
                          "-"}
                      </td>

                      <td>
                        {branchId
                          ? branches.find(
                              (branch) =>
                                branch.id ===
                                Number(
                                  branchId
                                )
                            )?.name ||
                            "-"
                          : "-"}
                      </td>

                      <td>
                        {day.type ===
                        "HOLIDAY"
                          ? "Not Applicable"
                          : branchSession
                          ? branchSession
                              .status ===
                            "COMPLETED"
                            ? "🔒 Completed"
                            : "📝 Draft"
                          : "Not Started"}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        )}
      </section>

      {/* =========================================
          ATTENDANCE SESSIONS
          ========================================= */}

      <section>
        <h2>
          Attendance Sessions
        </h2>

        <p>
          {filteredSessions.length}{" "}
          attendance session(s)
          found for the selected
          Branch, Study Year and
          Semester.
        </p>

        {filteredSessions.length ===
        0 ? (
          <p>
            No attendance sessions
            have been created for the
            selected branch and
            semester.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>
                  Date
                </th>

                <th>
                  Branch
                </th>

                <th>
                  Study Year
                </th>

                <th>
                  Semester
                </th>

                <th>
                  Status
                </th>

                <th>
                  Students
                </th>

                <th>
                  Completed At
                </th>

                <th>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredSessions.map(
                (session) => (
                  <tr
                    key={
                      session.id
                    }
                  >
                    <td>
                      {formatDate(
                        session
                          .academicDay
                          .date
                      )}
                    </td>

                    <td>
                      {
                        session
                          .branch
                          .name
                      }
                    </td>

                    <td>
                      {
                        session
                          .studyYear
                          .name
                      }
                    </td>

                    <td>
                      {
                        session
                          .semester
                          .name
                      }
                    </td>

                    <td>
                      {session.status ===
                      "COMPLETED"
                        ? "🔒 COMPLETED"
                        : "📝 DRAFT"}
                    </td>

                    <td>
                      {
                        session
                          .attendanceCount
                      }
                    </td>

                    <td>
                      {session.completedAt
                        ? new Date(
                            session.completedAt
                          ).toLocaleString(
                            "en-IN"
                          )
                        : "-"}
                    </td>

                    <td>
                      <Link
                        href={`/admin/attendance/${session.id}`}
                      >
                        {session.status ===
                        "COMPLETED"
                          ? "View"
                          : "Continue"}
                      </Link>
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