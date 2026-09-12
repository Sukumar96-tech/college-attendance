"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type StudyYear = {
  id: number;
  name: string;
  number: number;
  semesters: Semester[];
};

type Semester = {
  id: number;
  name: string;
  number: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
};

type AcademicDay = {
  id: number;
  date: string;
  type: "WORKING_DAY" | "HOLIDAY";
  remarks: string | null;

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

  attendanceSession: {
    id: number;
    status: "DRAFT" | "COMPLETED";
    completedAt: string | null;
  } | null;
};

type CalendarSummary = {
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

  totalDays: number;
  workingDays: number;
  holidays: number;

  attendance: {
    completed: number;
    draft: number;
    pending: number;
  };
};

export default function AcademicCalendarPage() {
  const [studyYears, setStudyYears] =
    useState<StudyYear[]>([]);

  const [academicDays, setAcademicDays] =
    useState<AcademicDay[]>([]);

  const [studyYearId, setStudyYearId] =
    useState("");

  const [semesterId, setSemesterId] =
    useState("");

  const [date, setDate] =
    useState("");

  const [type, setType] = useState<
    "WORKING_DAY" | "HOLIDAY"
  >("WORKING_DAY");

  const [remarks, setRemarks] =
    useState("");

  const [summary, setSummary] =
    useState<CalendarSummary | null>(null);

  const [editingDayId, setEditingDayId] =
    useState<number | null>(null);

  const [editType, setEditType] =
    useState<
      "WORKING_DAY" | "HOLIDAY"
    >("WORKING_DAY");

  const [editRemarks, setEditRemarks] =
    useState("");

  const [semesterNumber, setSemesterNumber] =
    useState("1");

  const [semesterName, setSemesterName] =
    useState("Semester 1");

  const [semesterStartDate, setSemesterStartDate] =
    useState("");

  const [semesterEndDate, setSemesterEndDate] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [updating, setUpdating] =
    useState(false);

  const [creatingSemester, setCreatingSemester] =
    useState(false);

  const [summaryLoading, setSummaryLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  /*
   * --------------------------------------------------
   * LOAD STUDY YEARS
   * --------------------------------------------------
   */

  async function loadStudyYears() {
    const response = await fetch(
      "/api/admin/study-years",
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
          "Unable to load study years."
      );
    }

    setStudyYears(result.data);

    if (result.data.length > 0) {
      const firstStudyYear =
        result.data[0];

      const firstStudyYearId =
        String(firstStudyYear.id);

      setStudyYearId(
        firstStudyYearId
      );

      if (
        firstStudyYear.semesters
          .length > 0
      ) {
        const firstSemester =
          firstStudyYear.semesters[0];

        const firstSemesterId =
          String(firstSemester.id);

        setSemesterId(
          firstSemesterId
        );

        setSemesterNumber(
          String(firstSemester.number)
        );

        setSemesterName(
          firstSemester.name
        );

        setSemesterStartDate(
          firstSemester.startDate.slice(
            0,
            10
          )
        );

        setSemesterEndDate(
          firstSemester.endDate.slice(
            0,
            10
          )
        );

        await loadSummary(
          firstSemesterId
        );
      } else {
        setSemesterId("");
        setSummary(null);
      }
    }
  }

  /*
   * --------------------------------------------------
   * LOAD ACADEMIC DAYS
   * --------------------------------------------------
   */

  async function loadAcademicDays() {
    const response = await fetch(
      "/api/admin/calendar",
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
          "Unable to load calendar."
      );
    }

    setAcademicDays(result.data);
  }

  /*
   * --------------------------------------------------
   * LOAD SUMMARY
   * --------------------------------------------------
   */

  async function loadSummary(
    selectedSemesterId: string
  ) {
    if (!selectedSemesterId) {
      setSummary(null);
      return;
    }

    try {
      setSummaryLoading(true);

      const response = await fetch(
        `/api/admin/calendar/summary?semesterId=${selectedSemesterId}`,
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
            "Unable to load calendar summary."
        );
      }

      setSummary(result.data);
    } catch (error) {
      console.error(
        "Calendar summary error:",
        error
      );

      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }

  /*
   * --------------------------------------------------
   * LOAD PAGE
   * --------------------------------------------------
   */

  async function loadPage() {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        loadStudyYears(),
        loadAcademicDays(),
      ]);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load calendar."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

  /*
   * --------------------------------------------------
   * SELECTED STUDY YEAR
   * --------------------------------------------------
   */

  const selectedStudyYear =
    studyYears.find(
      (year) =>
        String(year.id) ===
        studyYearId
    );

  const availableSemesters =
    selectedStudyYear?.semesters ?? [];

  /*
   * --------------------------------------------------
   * SELECTED SEMESTER
   * --------------------------------------------------
   */

  const selectedSemester =
    availableSemesters.find(
      (semester) =>
        String(semester.id) ===
        semesterId
    );

  /*
   * --------------------------------------------------
   * FILTER CALENDAR
   * --------------------------------------------------
   */

  const filteredDays =
    useMemo(() => {
      return academicDays.filter(
        (day) =>
          String(
            day.semester.id
          ) === semesterId
      );
    }, [
      academicDays,
      semesterId,
    ]);

  /*
   * --------------------------------------------------
   * STUDY YEAR CHANGE
   * --------------------------------------------------
   */

  function handleStudyYearChange(
    value: string
  ) {
    setStudyYearId(value);

    const selectedYear =
      studyYears.find(
        (year) =>
          String(year.id) === value
      );

    if (
      selectedYear &&
      selectedYear.semesters.length >
        0
    ) {
      const firstSemester =
        selectedYear.semesters[0];

      const firstSemesterId =
        String(firstSemester.id);

      setSemesterId(
        firstSemesterId
      );

      setSemesterNumber(
        String(firstSemester.number)
      );

      setSemesterName(
        firstSemester.name
      );

      setSemesterStartDate(
        firstSemester.startDate.slice(
          0,
          10
        )
      );

      setSemesterEndDate(
        firstSemester.endDate.slice(
          0,
          10
        )
      );

      loadSummary(
        firstSemesterId
      );
    } else {
      setSemesterId("");
      setSummary(null);
      setSemesterNumber("1");
      setSemesterName(
        "Semester 1"
      );
      setSemesterStartDate("");
      setSemesterEndDate("");
    }

    setDate("");
  }

  /*
   * --------------------------------------------------
   * SEMESTER CHANGE
   * --------------------------------------------------
   */

  function handleSemesterChange(
    value: string
  ) {
    setSemesterId(value);
    setDate("");

    const semester =
      availableSemesters.find(
        (item) =>
          String(item.id) === value
      );

    if (semester) {
      setSemesterNumber(
        String(semester.number)
      );

      setSemesterName(
        semester.name
      );

      setSemesterStartDate(
        semester.startDate.slice(
          0,
          10
        )
      );

      setSemesterEndDate(
        semester.endDate.slice(
          0,
          10
        )
      );
    }

    loadSummary(value);
  }

  /*
   * --------------------------------------------------
   * CREATE SEMESTER
   * --------------------------------------------------
   */

  async function handleCreateSemester(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setCreatingSemester(true);
    setError("");
    setMessage("");

    try {
      if (!studyYearId) {
        setError(
          "Please select a study year."
        );
        return;
      }

      if (
        !semesterNumber ||
        !semesterName ||
        !semesterStartDate ||
        !semesterEndDate
      ) {
        setError(
          "Please provide all semester details."
        );
        return;
      }

      const response = await fetch(
        "/api/admin/semesters",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            studyYearId:
              Number(studyYearId),

            name:
              semesterName.trim(),

            number:
              Number(
                semesterNumber
              ),

            startDate:
              semesterStartDate,

            endDate:
              semesterEndDate,
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
            "Unable to create semester."
        );

        return;
      }

      setMessage(
        result.message ||
          "Semester created successfully."
      );

      await loadStudyYears();

      /*
       * Select the newly created
       * semester.
       */

      const newSemester =
        result.data;

      if (newSemester?.id) {
        const newSemesterId =
          String(
            newSemester.id
          );

        setSemesterId(
          newSemesterId
        );

        await loadSummary(
          newSemesterId
        );
      }

      setSemesterNumber("1");
      setSemesterName(
        "Semester 1"
      );
      setSemesterStartDate("");
      setSemesterEndDate("");
    } catch {
      setError(
        "Unable to connect to the server."
      );
    } finally {
      setCreatingSemester(false);
    }
  }

  /*
   * --------------------------------------------------
   * CREATE ACADEMIC DAY
   * --------------------------------------------------
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (!semesterId) {
        setError(
          "Please select a semester."
        );
        return;
      }

      if (!date) {
        setError(
          "Please select a date."
        );
        return;
      }

      const response = await fetch(
        "/api/admin/calendar",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            semesterId:
              Number(semesterId),

            date,

            type,

            remarks,
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
            "Unable to save academic day."
        );

        return;
      }

      setMessage(
        result.message
      );

      setDate("");
      setRemarks("");
      setType("WORKING_DAY");

      await Promise.all([
        loadAcademicDays(),
        loadSummary(
          semesterId
        ),
      ]);
    } catch {
      setError(
        "Unable to connect to the server."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * --------------------------------------------------
   * START EDITING
   * --------------------------------------------------
   */

  function startEditingDay(
    day: AcademicDay
  ) {
    setEditingDayId(day.id);
    setEditType(day.type);
    setEditRemarks(
      day.remarks || ""
    );

    setError("");
    setMessage("");
  }

  /*
   * --------------------------------------------------
   * CANCEL EDITING
   * --------------------------------------------------
   */

  function cancelEditingDay() {
    setEditingDayId(null);
    setEditType(
      "WORKING_DAY"
    );
    setEditRemarks("");
  }

  /*
   * --------------------------------------------------
   * UPDATE ACADEMIC DAY
   * --------------------------------------------------
   */

  async function updateAcademicDay() {
    if (
      editingDayId === null
    ) {
      return;
    }

    try {
      setUpdating(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/admin/calendar/${editingDayId}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            type: editType,
            remarks:
              editRemarks,
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
            "Unable to update academic day."
        );

        return;
      }

      setMessage(
        result.message
      );

      const currentSemesterId =
        semesterId;

      cancelEditingDay();

      await Promise.all([
        loadAcademicDays(),
        loadSummary(
          currentSemesterId
        ),
      ]);
    } catch {
      setError(
        "Unable to connect to the server."
      );
    } finally {
      setUpdating(false);
    }
  }

  /*
   * --------------------------------------------------
   * FORMAT DATE
   * --------------------------------------------------
   */

  function formatDate(
    value: string
  ) {
    const dateValue =
      new Date(value);

    if (
      Number.isNaN(
        dateValue.getTime()
      )
    ) {
      return value;
    }

    return dateValue.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  }

  /*
   * --------------------------------------------------
   * PAGE
   * --------------------------------------------------
   */

  return (
    <main>
      <h1>
        Academic Calendar
      </h1>

      <p>
        Configure semester periods,
        working days, and holidays.
      </p>

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

      {loading && (
        <p>
          Loading calendar...
        </p>
      )}

      {!loading && (
        <>
          {/* =========================================
              STUDY YEAR & SEMESTER
          ========================================= */}

          <section>
            <h2>
              Academic Structure
            </h2>

            <div>
              <label
                htmlFor="studyYear"
              >
                Study Year
              </label>

              <select
                id="studyYear"
                value={
                  studyYearId
                }
                onChange={(event) =>
                  handleStudyYearChange(
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Select Study Year
                </option>

                {studyYears.map(
                  (year) => (
                    <option
                      key={year.id}
                      value={year.id}
                    >
                      {year.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="semester"
              >
                Semester
              </label>

              <select
                id="semester"
                value={
                  semesterId
                }
                onChange={(event) =>
                  handleSemesterChange(
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Select Semester
                </option>

                {availableSemesters.map(
                  (semester) => (
                    <option
                      key={semester.id}
                      value={semester.id}
                    >
                      {semester.name}
                    </option>
                  )
                )}
              </select>
            </div>

            {selectedSemester && (
              <p>
                <strong>
                  Semester Period:
                </strong>{" "}
                {formatDate(
                  selectedSemester.startDate
                )}{" "}
                to{" "}
                {formatDate(
                  selectedSemester.endDate
                )}
              </p>
            )}
          </section>

          {/* =========================================
              CREATE SEMESTER PERIOD
          ========================================= */}

          <section>
            <h2>
              Create Semester Period
            </h2>

            <p>
              The Admin decides the
              actual semester dates.
              No default academic period
              is used.
            </p>

            <form
              onSubmit={
                handleCreateSemester
              }
            >
              <div>
                <label
                  htmlFor="semesterNumber"
                >
                  Semester
                </label>

                <select
                  id="semesterNumber"
                  value={
                    semesterNumber
                  }
                  onChange={(event) => {
                    const value =
                      event.target.value;

                    setSemesterNumber(
                      value
                    );

                    setSemesterName(
                      value === "1"
                        ? "Semester 1"
                        : "Semester 2"
                    );
                  }}
                  required
                >
                  <option value="1">
                    Semester 1
                  </option>

                  <option value="2">
                    Semester 2
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="semesterName"
                >
                  Semester Name
                </label>

                <input
                  id="semesterName"
                  type="text"
                  value={
                    semesterName
                  }
                  onChange={(event) =>
                    setSemesterName(
                      event.target.value
                    )
                  }
                  placeholder="Semester 1"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="semesterStartDate"
                >
                  Start Date
                </label>

                <input
                  id="semesterStartDate"
                  type="date"
                  value={
                    semesterStartDate
                  }
                  onChange={(event) =>
                    setSemesterStartDate(
                      event.target.value
                    )
                  }
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="semesterEndDate"
                >
                  End Date
                </label>

                <input
                  id="semesterEndDate"
                  type="date"
                  value={
                    semesterEndDate
                  }
                  onChange={(event) =>
                    setSemesterEndDate(
                      event.target.value
                    )
                  }
                  required
                />
              </div>

              <button
                type="submit"
                disabled={
                  creatingSemester
                }
              >
                {creatingSemester
                  ? "Creating..."
                  : "Create Semester"}
              </button>
            </form>
          </section>

          {/* =========================================
              ADD ACADEMIC DAY
          ========================================= */}

          <section>
            <h2>
              Add Academic Day
            </h2>

            {!semesterId ? (
              <p>
                Create or select a semester
                before configuring academic
                days.
              </p>
            ) : (
              <form
                onSubmit={
                  handleSubmit
                }
              >
                <div>
                  <label
                    htmlFor="calendarDate"
                  >
                    Date
                  </label>

                  <input
                    id="calendarDate"
                    type="date"
                    value={date}
                    min={
                      selectedSemester
                        ? selectedSemester.startDate.slice(
                            0,
                            10
                          )
                        : undefined
                    }
                    max={
                      selectedSemester
                        ? selectedSemester.endDate.slice(
                            0,
                            10
                          )
                        : undefined
                    }
                    onChange={(event) =>
                      setDate(
                        event.target.value
                      )
                    }
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="type"
                  >
                    Day Type
                  </label>

                  <select
                    id="type"
                    value={type}
                    onChange={(event) =>
                      setType(
                        event.target
                          .value as
                          | "WORKING_DAY"
                          | "HOLIDAY"
                      )
                    }
                  >
                    <option value="WORKING_DAY">
                      Working Day
                    </option>

                    <option value="HOLIDAY">
                      Holiday
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="remarks"
                  >
                    Remarks
                  </label>

                  <textarea
                    id="remarks"
                    value={remarks}
                    onChange={(event) =>
                      setRemarks(
                        event.target.value
                      )
                    }
                    placeholder="Optional remarks"
                    rows={3}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Academic Day"}
                </button>
              </form>
            )}
          </section>

          {/* =========================================
              CALENDAR OVERVIEW
          ========================================= */}

          <section>
            <h2>
              Calendar Overview
            </h2>

            {summaryLoading && (
              <p>
                Loading summary...
              </p>
            )}

            {!summaryLoading &&
              summary && (
                <>
                  <p>
                    <strong>
                      Study Year:
                    </strong>{" "}
                    {
                      summary
                        .studyYear
                        .name
                    }
                  </p>

                  <p>
                    <strong>
                      Semester:
                    </strong>{" "}
                    {
                      summary
                        .semester
                        .name
                    }
                  </p>

                  <p>
                    <strong>
                      Semester Period:
                    </strong>{" "}
                    {formatDate(
                      summary
                        .semester
                        .startDate
                    )}{" "}
                    to{" "}
                    {formatDate(
                      summary
                        .semester
                        .endDate
                    )}
                  </p>

                  <div>
                    <div>
                      <h3>
                        Total Days
                      </h3>

                      <p>
                        {
                          summary.totalDays
                        }
                      </p>
                    </div>

                    <div>
                      <h3>
                        Working Days
                      </h3>

                      <p>
                        {
                          summary
                            .workingDays
                        }
                      </p>
                    </div>

                    <div>
                      <h3>
                        Holidays
                      </h3>

                      <p>
                        {
                          summary
                            .holidays
                        }
                      </p>
                    </div>

                    <div>
                      <h3>
                        Attendance Completed
                      </h3>

                      <p>
                        {
                          summary
                            .attendance
                            .completed
                        }
                      </p>
                    </div>

                    <div>
                      <h3>
                        Attendance Draft
                      </h3>

                      <p>
                        {
                          summary
                            .attendance
                            .draft
                        }
                      </p>
                    </div>

                    <div>
                      <h3>
                        Attendance Pending
                      </h3>

                      <p>
                        {
                          summary
                            .attendance
                            .pending
                        }
                      </p>
                    </div>
                  </div>
                </>
              )}

            {!summaryLoading &&
              !summary &&
              semesterId && (
                <p>
                  No summary available
                  for the selected semester.
                </p>
              )}
          </section>

          {/* =========================================
              SEMESTER CALENDAR
          ========================================= */}

          <section>
            <h2>
              Semester Calendar
            </h2>

            <p>
              Showing{" "}
              {
                filteredDays.length
              }{" "}
              configured day(s).
            </p>

            {/* =====================================
                EDIT FORM
            ===================================== */}

            {editingDayId !==
              null && (
              <section>
                <h2>
                  Edit Academic Day
                </h2>

                <div>
                  <label
                    htmlFor="editType"
                  >
                    Day Type
                  </label>

                  <select
                    id="editType"
                    value={editType}
                    onChange={(event) =>
                      setEditType(
                        event.target
                          .value as
                          | "WORKING_DAY"
                          | "HOLIDAY"
                      )
                    }
                  >
                    <option value="WORKING_DAY">
                      Working Day
                    </option>

                    <option value="HOLIDAY">
                      Holiday
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="editRemarks"
                  >
                    Remarks
                  </label>

                  <textarea
                    id="editRemarks"
                    value={
                      editRemarks
                    }
                    onChange={(event) =>
                      setEditRemarks(
                        event.target.value
                      )
                    }
                    rows={3}
                  />
                </div>

                <button
                  type="button"
                  disabled={updating}
                  onClick={
                    updateAcademicDay
                  }
                >
                  {updating
                    ? "Updating..."
                    : "Update Academic Day"}
                </button>

                <button
                  type="button"
                  disabled={updating}
                  onClick={
                    cancelEditingDay
                  }
                >
                  Cancel
                </button>
              </section>
            )}

            {/* =====================================
                CALENDAR TABLE
            ===================================== */}

            {filteredDays.length ===
            0 ? (
              <p>
                No academic days have
                been configured for
                this semester.
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
                      Attendance
                    </th>

                    <th>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDays.map(
                    (day) => (
                      <tr
                        key={
                          day.id
                        }
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
                          {day.type ===
                          "HOLIDAY"
                            ? "Not Applicable"
                            : day
                                .attendanceSession
                              ? day
                                  .attendanceSession
                                  .status ===
                                "COMPLETED"
                                ? "Completed"
                                : "Draft"
                              : "Not Started"}
                        </td>

                        <td>
                          {day
                            .attendanceSession
                            ?.status ===
                          "COMPLETED" ? (
                            <span>
                              Locked
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                startEditingDay(
                                  day
                                )
                              }
                            >
                              Edit
                            </button>
                          )}
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