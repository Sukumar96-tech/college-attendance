"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type AttendanceRecord = {
  attendanceId: number;
  sessionId: number;
  date: string;
  status: "PRESENT" | "ABSENT";
  remarks: string | null;
};

type AttendanceSummary = {
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  percentage: number;
};

type StudentInfo = {
  id: number;
  hallTicket: string;
  name: string;
  studyYear: {
    id: number;
  };
  branch: {
    id: number;
    name: string;
    code: string;
  };
};

type AttendanceResponse = {
  success: boolean;
  message?: string;
  data?: {
    student: StudentInfo;
    summary: AttendanceSummary;
    filter: {
      month: string | null;
    };
    records: AttendanceRecord[];
  };
};

function formatDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMonth(month: string) {
  if (!month) return "All attendance";

  const [year, monthNumber] = month.split("-");
  const date = new Date(
    Number(year),
    Number(monthNumber) - 1,
    1
  );

  if (Number.isNaN(date.getTime())) return month;

  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function getCurrentMonth() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function CalendarIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4M16 2v4M3 9h18" />
    </svg>
  );
}

function CheckIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function CrossIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function RefreshIcon({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 11a8.1 8.1 0 0 0-14.8-4L3 10" />
      <path d="M3 5v5h5" />
      <path d="M4 13a8.1 8.1 0 0 0 14.8 4L21 14" />
      <path d="M21 19v-5h-5" />
    </svg>
  );
}

function ArrowLeftIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function EyeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.7" />
    </svg>
  );
}

export default function StudentAttendancePage() {
  const [month, setMonth] = useState("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [student, setStudent] = useState<StudentInfo | null>(null);

  const [summary, setSummary] = useState<AttendanceSummary>({
    totalWorkingDays: 0,
    presentDays: 0,
    absentDays: 0,
    percentage: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRecord, setSelectedRecord] =
    useState<AttendanceRecord | null>(null);

  useEffect(() => {
    const currentMonth = getCurrentMonth();
    setMonth(currentMonth);
    loadAttendance(currentMonth);
  }, []);

  async function loadAttendance(selectedMonth?: string) {
    try {
      setLoading(true);
      setError("");

      const monthToLoad =
        selectedMonth !== undefined ? selectedMonth : month;

      const url = monthToLoad
        ? `/api/student/attendance?month=${encodeURIComponent(
            monthToLoad
          )}`
        : "/api/student/attendance";

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const result: AttendanceResponse =
        await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.message || "Unable to load attendance."
        );
      }

      setStudent(result.data.student);
      setSummary(result.data.summary);
      setRecords(result.data.records);
    } catch (err) {
      console.error("Student attendance page error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load attendance."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleMonthChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedMonth = event.target.value;

    setMonth(selectedMonth);
    loadAttendance(selectedMonth);
  }

  const percentage = useMemo(() => {
    const value = Number(summary.percentage);

    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.min(100, Math.max(0, value));
  }, [summary.percentage]);

  const presentRecords = records.filter(
    (record) => record.status === "PRESENT"
  );

  const absentRecords = records.filter(
    (record) => record.status === "ABSENT"
  );

  const attendanceStatus =
    percentage >= 75
      ? {
          label: "Good Attendance",
          description:
            "Your attendance is above the recommended level.",
          background: "#ecfdf3",
          color: "#16734a",
          border: "#b7ebcd",
        }
      : percentage >= 65
        ? {
            label: "Needs Attention",
            description:
              "Try to maintain a consistent attendance record.",
            background: "#fff8e6",
            color: "#946200",
            border: "#f2d58a",
          }
        : {
            label: "Low Attendance",
            description:
              "Your attendance requires immediate attention.",
            background: "#fff0f1",
            color: "#8e2734",
            border: "#efc1c6",
          };

  const presentPercentage =
    summary.totalWorkingDays > 0
      ? (summary.presentDays /
          summary.totalWorkingDays) *
        100
      : 0;

  const absentPercentage =
    summary.totalWorkingDays > 0
      ? (summary.absentDays /
          summary.totalWorkingDays) *
        100
      : 0;

  return (
    <main
      style={{
        minHeight: "calc(100vh - 76px)",
        background: "#f4f6f9",
        color: "#172033",
      }}
    >
      <div
        className="attendance-page-container"
        style={{
          width: "100%",
          maxWidth: "1380px",
          margin: "0 auto",
          padding: "32px 30px 50px",
        }}
      >
        {/* PAGE HEADER */}

        <section
          className="attendance-page-header"
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "20px",
            marginBottom: "24px",
          }}
        >
          <div>
            <Link
              href="/student/dashboard"
              className="attendance-back-link"
            >
              <ArrowLeftIcon size={15} />
              <span>Back to Dashboard</span>
            </Link>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                marginTop: "18px",
                color: "#8b6c1f",
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#c7a443",
                }}
              />
              Student Portal
            </div>

            <h1
              style={{
                margin: "7px 0 0",
                fontSize: "30px",
                lineHeight: 1.15,
                fontWeight: 850,
                letterSpacing: "-0.025em",
              }}
            >
              My Attendance
            </h1>

            <p
              style={{
                margin: "8px 0 0",
                color: "#687386",
                fontSize: "13px",
              }}
            >
              View your completed attendance records and
              monthly attendance performance.
            </p>
          </div>

          {student && (
            <div
              className="attendance-student-chip"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 13px",
                border: "1px solid #dfe4ea",
                borderRadius: "10px",
                background: "#ffffff",
                boxShadow:
                  "0 4px 15px rgba(15,23,42,0.04)",
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  background: "#c7a443",
                  color: "#172334",
                  fontSize: "12px",
                  fontWeight: 900,
                }}
              >
                {student.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <strong
                  style={{
                    display: "block",
                    maxWidth: "180px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: "#263247",
                    fontSize: "11px",
                    fontWeight: 800,
                  }}
                >
                  {student.name}
                </strong>

                <span
                  style={{
                    color: "#8993a1",
                    fontSize: "9px",
                    fontWeight: 600,
                  }}
                >
                  {student.hallTicket}
                </span>
              </div>
            </div>
          )}
        </section>

        {loading && (
          <section
            style={{
              padding: "55px 25px",
              textAlign: "center",
              border: "1px solid #e0e5eb",
              borderRadius: "15px",
              background: "#ffffff",
              boxShadow:
                "0 5px 20px rgba(15,23,42,0.045)",
            }}
          >
            <div
              className="attendance-loader"
              style={{
                width: "34px",
                height: "34px",
                margin: "0 auto 14px",
                border: "3px solid #e7ebef",
                borderTopColor: "#c7a443",
                borderRadius: "50%",
              }}
            />

            <strong
              style={{
                display: "block",
                color: "#263247",
                fontSize: "13px",
              }}
            >
              Loading attendance
            </strong>

            <p
              style={{
                margin: "5px 0 0",
                color: "#8993a1",
                fontSize: "10px",
              }}
            >
              Please wait while your records are loaded.
            </p>
          </section>
        )}

        {!loading && error && (
          <section
            style={{
              padding: "24px",
              border: "1px solid #efc1c6",
              borderRadius: "15px",
              background: "#fff0f1",
              boxShadow:
                "0 5px 20px rgba(142,39,52,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "13px",
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  background: "#8e2734",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 900,
                }}
              >
                !
              </div>

              <div style={{ flex: 1 }}>
                <h2
                  style={{
                    margin: 0,
                    color: "#8e2734",
                    fontSize: "15px",
                    fontWeight: 800,
                  }}
                >
                  Unable to Load Attendance
                </h2>

                <p
                  style={{
                    margin: "5px 0 15px",
                    color: "#91414b",
                    fontSize: "11px",
                  }}
                >
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => loadAttendance()}
                  className="attendance-primary-button"
                >
                  <RefreshIcon size={15} />
                  Try Again
                </button>
              </div>
            </div>
          </section>
        )}

        {!loading && !error && student && (
          <>
            {/* STUDENT SUMMARY CARD */}

            <section
              className="attendance-hero-card"
              style={{
                position: "relative",
                overflow: "hidden",
                marginBottom: "20px",
                padding: "24px 26px",
                borderRadius: "15px",
                background:
                  "linear-gradient(135deg, #172334 0%, #20334b 100%)",
                color: "#ffffff",
                boxShadow:
                  "0 12px 30px rgba(15,23,42,0.12)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: "250px",
                  height: "250px",
                  right: "-90px",
                  top: "-120px",
                  border: "1px solid rgba(199,164,67,0.16)",
                  borderRadius: "50%",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  width: "160px",
                  height: "160px",
                  right: "80px",
                  bottom: "-120px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "50%",
                }}
              />

              <div
                className="attendance-hero-content"
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: "18px",
                }}
              >
                <div
                  style={{
                    width: "58px",
                    height: "58px",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "14px",
                    background: "#c7a443",
                    color: "#172334",
                    fontSize: "20px",
                    fontWeight: 900,
                  }}
                >
                  {student.name.charAt(0).toUpperCase()}
                </div>

                <div style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      color: "#9ca9b9",
                      fontSize: "9px",
                      fontWeight: 800,
                      letterSpacing: "0.13em",
                      textTransform: "uppercase",
                    }}
                  >
                    Attendance Record
                  </span>

                  <h2
                    style={{
                      margin: 0,
                      color: "#ffffff",
                      fontSize: "19px",
                      fontWeight: 800,
                    }}
                  >
                    {student.name}
                  </h2>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "7px",
                      marginTop: "6px",
                      color: "#b9c4d0",
                      fontSize: "10px",
                    }}
                  >
                    <span>{student.hallTicket}</span>
                    <span style={{ color: "#526276" }}>•</span>
                    <span>{student.branch.name}</span>
                    <span style={{ color: "#526276" }}>•</span>
                    <span>{student.branch.code}</span>
                  </div>
                </div>

                <div
                  className="attendance-hero-percentage"
                  style={{
                    marginLeft: "auto",
                    textAlign: "right",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      color: "#9ca9b9",
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Attendance
                  </span>

                  <strong
                    style={{
                      display: "block",
                      marginTop: "2px",
                      color: "#ffffff",
                      fontSize: "27px",
                      lineHeight: 1,
                      fontWeight: 900,
                    }}
                  >
                    {percentage.toFixed(1)}%
                  </strong>
                </div>
              </div>
            </section>

            {/* FILTER */}

            <section
              style={{
                marginBottom: "20px",
                padding: "18px 20px",
                border: "1px solid #e0e5eb",
                borderRadius: "14px",
                background: "#ffffff",
                boxShadow:
                  "0 5px 20px rgba(15,23,42,0.045)",
              }}
            >
              <div
                className="attendance-filter-row"
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minWidth: "190px",
                  }}
                >
                  <label
                    htmlFor="attendance-month"
                    style={{
                      display: "block",
                      marginBottom: "7px",
                      color: "#4e5969",
                      fontSize: "10px",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                    }}
                  >
                    Attendance Period
                  </label>

                  <div style={{ position: "relative" }}>
                    <CalendarIcon size={16} />

                    <input
                      id="attendance-month"
                      type="month"
                      value={month}
                      onChange={handleMonthChange}
                      className="attendance-month-input"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => loadAttendance()}
                  className="attendance-secondary-button"
                >
                  <RefreshIcon size={15} />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMonth("");
                    loadAttendance("");
                  }}
                  className="attendance-primary-button"
                >
                  View All
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid #edf0f3",
                  color: "#8993a1",
                  fontSize: "10px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#c7a443",
                  }}
                />

                Showing:
                <strong
                  style={{
                    color: "#4e5969",
                    fontWeight: 700,
                  }}
                >
                  {formatMonth(month)}
                </strong>
              </div>
            </section>

            {/* STAT CARDS */}

            <section
              className="attendance-stat-grid"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(4, minmax(0, 1fr))",
                gap: "14px",
                marginBottom: "20px",
              }}
            >
              <SummaryCard
                label="Attendance"
                value={`${percentage.toFixed(1)}%`}
                description="Overall percentage"
                icon="percentage"
                accent="#c7a443"
              />

              <SummaryCard
                label="Present"
                value={String(summary.presentDays)}
                description="Days attended"
                icon="present"
                accent="#248653"
              />

              <SummaryCard
                label="Absent"
                value={String(summary.absentDays)}
                description="Days missed"
                icon="absent"
                accent="#9b3442"
              />

              <SummaryCard
                label="Working Days"
                value={String(summary.totalWorkingDays)}
                description="Completed days"
                icon="calendar"
                accent="#496b91"
              />
            </section>

            {/* OVERVIEW */}

            <section
              className="attendance-overview-grid"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(0, 1.3fr) minmax(280px, 0.7fr)",
                gap: "18px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  padding: "22px",
                  border: "1px solid #e0e5eb",
                  borderRadius: "14px",
                  background: "#ffffff",
                  boxShadow:
                    "0 5px 20px rgba(15,23,42,0.045)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "12px",
                    marginBottom: "22px",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: 800,
                      }}
                    >
                      Attendance Overview
                    </h2>

                    <p
                      style={{
                        margin: "4px 0 0",
                        color: "#8993a1",
                        fontSize: "10px",
                      }}
                    >
                      Based on completed working days
                    </p>
                  </div>

                  <span
                    style={{
                      padding: "6px 9px",
                      borderRadius: "6px",
                      background: attendanceStatus.background,
                      color: attendanceStatus.color,
                      border:
                        `1px solid ${attendanceStatus.border}`,
                      fontSize: "9px",
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {attendanceStatus.label}
                  </span>
                </div>

                <div
                  className="attendance-overview-inner"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "35px",
                  }}
                >
                  <div
                    className="attendance-circle"
                    style={{
                      position: "relative",
                      width: "155px",
                      height: "155px",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      background:
                        `conic-gradient(#c7a443 ${
                          percentage * 3.6
                        }deg, #e9edf1 0deg)`,
                    }}
                  >
                    <div
                      style={{
                        width: "119px",
                        height: "119px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        background: "#ffffff",
                      }}
                    >
                      <strong
                        style={{
                          fontSize: "25px",
                          lineHeight: 1,
                          fontWeight: 900,
                        }}
                      >
                        {percentage.toFixed(1)}%
                      </strong>

                      <span
                        style={{
                          marginTop: "6px",
                          color: "#8993a1",
                          fontSize: "8px",
                          fontWeight: 800,
                          letterSpacing: "0.08em",
                        }}
                      >
                        ATTENDANCE
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <ProgressRow
                      label="Present"
                      value={summary.presentDays}
                      percentage={presentPercentage}
                      background="#248653"
                    />

                    <ProgressRow
                      label="Absent"
                      value={summary.absentDays}
                      percentage={absentPercentage}
                      background="#9b3442"
                    />

                    <div
                      style={{
                        marginTop: "17px",
                        paddingTop: "14px",
                        borderTop: "1px solid #edf0f3",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "10px",
                        }}
                      >
                        <span
                          style={{
                            color: "#8993a1",
                            fontSize: "9px",
                            fontWeight: 600,
                          }}
                        >
                          Completed working days
                        </span>

                        <strong
                          style={{
                            color: "#263247",
                            fontSize: "11px",
                          }}
                        >
                          {summary.totalWorkingDays}
                        </strong>
                      </div>

                      <p
                        style={{
                          margin: "7px 0 0",
                          color: attendanceStatus.color,
                          fontSize: "9px",
                        }}
                      >
                        {attendanceStatus.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "22px",
                  border: "1px solid #e0e5eb",
                  borderRadius: "14px",
                  background: "#ffffff",
                  boxShadow:
                    "0 5px 20px rgba(15,23,42,0.045)",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: 800,
                  }}
                >
                  Student Information
                </h2>

                <p
                  style={{
                    margin: "4px 0 17px",
                    color: "#8993a1",
                    fontSize: "10px",
                  }}
                >
                  Current academic details
                </p>

                <InfoRow
                  label="Hall Ticket"
                  value={student.hallTicket}
                  highlight
                />

                <InfoRow
                  label="Student Name"
                  value={student.name}
                />

                <InfoRow
                  label="Branch"
                  value={student.branch.name}
                />

                <InfoRow
                  label="Branch Code"
                  value={student.branch.code}
                />
              </div>
            </section>

            {/* ATTENDANCE HISTORY */}

            <section
              style={{
                overflow: "hidden",
                border: "1px solid #e0e5eb",
                borderRadius: "14px",
                background: "#ffffff",
                boxShadow:
                  "0 5px 20px rgba(15,23,42,0.045)",
              }}
            >
              <div
                style={{
                  padding: "21px 22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "15px",
                  borderBottom: "1px solid #e7ebef",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      fontWeight: 800,
                    }}
                  >
                    Attendance History
                  </h2>

                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#8993a1",
                      fontSize: "10px",
                    }}
                  >
                    {records.length} completed record
                    {records.length === 1 ? "" : "s"}
                    {month
                      ? ` · ${formatMonth(month)}`
                      : ""}
                  </p>
                </div>

                <div
                  className="history-counts"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                  }}
                >
                  <span className="history-count present">
                    <CheckIcon size={12} />
                    {presentRecords.length}
                  </span>

                  <span className="history-count absent">
                    <CrossIcon size={12} />
                    {absentRecords.length}
                  </span>
                </div>
              </div>

              {records.length === 0 ? (
                <div
                  style={{
                    padding: "55px 25px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      width: "46px",
                      height: "46px",
                      margin: "0 auto 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "12px",
                      background: "#f4f6f9",
                      color: "#8b96a5",
                    }}
                  >
                    <CalendarIcon size={21} />
                  </div>

                  <strong
                    style={{
                      display: "block",
                      color: "#4e5969",
                      fontSize: "12px",
                    }}
                  >
                    No attendance records found
                  </strong>

                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#8993a1",
                      fontSize: "10px",
                    }}
                  >
                    No completed attendance records are
                    available
                    {month ? ` for ${formatMonth(month)}` : ""}.
                  </p>
                </div>
              ) : (
                <div
                  className="attendance-table-wrapper"
                  style={{
                    width: "100%",
                    overflowX: "auto",
                  }}
                >
                  <table
                    className="attendance-table"
                    style={{
                      width: "100%",
                      minWidth: "720px",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Remarks</th>
                        <th>Details</th>
                      </tr>
                    </thead>

                    <tbody>
                      {records.map((record, index) => (
                        <tr key={record.attendanceId}>
                          <td>
                            <span className="serial-number">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                          </td>

                          <td>
                            <strong className="history-date">
                              {formatDate(record.date)}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={`attendance-status-pill ${
                                record.status === "PRESENT"
                                  ? "present"
                                  : "absent"
                              }`}
                            >
                              {record.status === "PRESENT" ? (
                                <CheckIcon size={12} />
                              ) : (
                                <CrossIcon size={12} />
                              )}
                              {record.status}
                            </span>
                          </td>

                          <td>
                            <span className="history-remarks">
                              {record.remarks || "No remarks"}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedRecord(record)
                              }
                              className="view-details-button"
                            >
                              <EyeIcon size={14} />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* FOOTER */}

            <footer
              style={{
                marginTop: "30px",
                paddingTop: "18px",
                borderTop: "1px solid #e0e5eb",
                display: "flex",
                justifyContent: "space-between",
                gap: "15px",
                color: "#8993a1",
                fontSize: "9px",
              }}
            >
              <span>
                College Attendance Management System
              </span>

              <span>Student Portal · My Attendance</span>
            </footer>
          </>
        )}
      </div>

      {/* DETAILS MODAL */}

      {selectedRecord && (
        <div
          className="attendance-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedRecord(null);
            }
          }}
        >
          <section
            className="attendance-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="attendance-detail-title"
          >
            <div
              className="attendance-modal-header"
            >
              <div>
                <span
                  style={{
                    display: "block",
                    marginBottom: "4px",
                    color: "#8b6c1f",
                    fontSize: "9px",
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Attendance Record
                </span>

                <h2 id="attendance-detail-title">
                  Attendance Details
                </h2>
              </div>

              <button
                type="button"
                className="modal-close-button"
                onClick={() => setSelectedRecord(null)}
                aria-label="Close attendance details"
              >
                ×
              </button>
            </div>

            <div className="modal-detail-grid">
              <div>
                <span>Date</span>
                <strong>
                  {formatDate(selectedRecord.date)}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong
                  className={
                    selectedRecord.status === "PRESENT"
                      ? "modal-present"
                      : "modal-absent"
                  }
                >
                  {selectedRecord.status}
                </strong>
              </div>
            </div>

            <div className="modal-remarks">
              <span>Remarks</span>
              <p>
                {selectedRecord.remarks ||
                  "No remarks were added for this attendance record."}
              </p>
            </div>

            <button
              type="button"
              className="modal-done-button"
              onClick={() => setSelectedRecord(null)}
            >
              Close Details
            </button>
          </section>
        </div>
      )}

      <style>{`
        .attendance-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #687386;
          text-decoration: none;
          font-size: 10px;
          font-weight: 700;
          transition: color 160ms ease;
        }

        .attendance-back-link:hover {
          color: #8b6c1f;
        }

        .attendance-primary-button,
        .attendance-secondary-button {
          min-height: 39px;
          padding: 0 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 800;
          transition:
            transform 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
        }

        .attendance-primary-button {
          background: #c7a443;
          color: #172334;
          box-shadow: 0 5px 12px rgba(199,164,67,0.16);
        }

        .attendance-primary-button:hover {
          background: #b79435;
          transform: translateY(-1px);
          box-shadow: 0 7px 16px rgba(199,164,67,0.22);
        }

        .attendance-secondary-button {
          border: 1px solid #dfe4ea;
          background: #ffffff;
          color: #4e5969;
        }

        .attendance-secondary-button:hover {
          background: #f7f8fa;
          transform: translateY(-1px);
        }

        .attendance-month-input {
          width: 100%;
          min-height: 40px;
          padding: 0 11px 0 37px;
          border: 1px solid #dfe4ea;
          border-radius: 8px;
          background: #ffffff;
          color: #263247;
          font-size: 11px;
          font-weight: 600;
        }

        .attendance-month-input:focus {
          border-color: #c7a443;
          outline: 2px solid rgba(199,164,67,0.13);
          outline-offset: 1px;
        }

        .attendance-month-input + svg {
          position: absolute;
        }

        .attendance-month-input {
          position: relative;
        }

        .attendance-month-input::-webkit-calendar-picker-indicator {
          cursor: pointer;
        }

        .attendance-stat-card {
          position: relative;
          overflow: hidden;
          min-height: 124px;
          padding: 18px;
          border: 1px solid #e0e5eb;
          border-radius: 13px;
          background: #ffffff;
          box-shadow: 0 5px 20px rgba(15,23,42,0.045);
          transition:
            transform 160ms ease,
            box-shadow 160ms ease;
        }

        .attendance-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(15,23,42,0.08);
        }

        .attendance-stat-icon {
          width: 29px;
          height: 29px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }

        .progress-track {
          width: 100%;
          height: 7px;
          overflow: hidden;
          border-radius: 20px;
          background: #edf0f3;
        }

        .progress-fill {
          height: 100%;
          border-radius: 20px;
          transition: width 400ms ease;
        }

        .info-row {
          min-height: 41px;
          padding: 0 11px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid #edf0f3;
          background: #ffffff;
        }

        .info-row:last-child {
          border-bottom: 0;
        }

        .history-count {
          min-width: 30px;
          min-height: 25px;
          padding: 0 7px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 800;
        }

        .history-count.present {
          background: #ecfdf3;
          color: #16734a;
        }

        .history-count.absent {
          background: #fff0f1;
          color: #8e2734;
        }

        .attendance-table th {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e7ebef;
          background: #f8f9fb;
          color: #7a8594;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .attendance-table td {
          padding: 13px 16px;
          border-bottom: 1px solid #edf0f3;
          color: #4e5969;
          font-size: 10px;
          vertical-align: middle;
        }

        .attendance-table tbody tr {
          transition: background 140ms ease;
        }

        .attendance-table tbody tr:hover {
          background: #fafbfc;
        }

        .attendance-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .serial-number {
          color: #a1a9b4;
          font-size: 9px;
          font-weight: 800;
        }

        .history-date {
          color: #263247;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .history-remarks {
          display: block;
          max-width: 310px;
          overflow: hidden;
          color: #7a8594;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .attendance-status-pill {
          min-height: 25px;
          padding: 0 8px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border-radius: 6px;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.04em;
        }

        .attendance-status-pill.present {
          background: #ecfdf3;
          color: #16734a;
        }

        .attendance-status-pill.absent {
          background: #fff0f1;
          color: #8e2734;
        }

        .view-details-button {
          min-height: 29px;
          padding: 0 9px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border: 1px solid #dfe4ea;
          border-radius: 7px;
          background: #ffffff;
          color: #4e5969;
          cursor: pointer;
          font-size: 9px;
          font-weight: 800;
          transition:
            background 160ms ease,
            color 160ms ease,
            border-color 160ms ease;
        }

        .view-details-button:hover {
          border-color: #d4c17e;
          background: #fffdf6;
          color: #8b6c1f;
        }

        .attendance-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 2000;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15,23,42,0.58);
          backdrop-filter: blur(3px);
        }

        .attendance-modal {
          width: min(100%, 460px);
          overflow: hidden;
          border: 1px solid #dfe4ea;
          border-radius: 15px;
          background: #ffffff;
          box-shadow: 0 25px 70px rgba(15,23,42,0.25);
          animation: attendance-modal-in 180ms ease-out;
        }

        @keyframes attendance-modal-in {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.985);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .attendance-modal-header {
          padding: 20px 21px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          border-bottom: 1px solid #e7ebef;
        }

        .attendance-modal-header h2 {
          margin: 0;
          color: #172033;
          font-size: 17px;
          font-weight: 800;
        }

        .modal-close-button {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
          background: #f4f6f9;
          color: #687386;
          cursor: pointer;
          font-size: 20px;
          line-height: 1;
        }

        .modal-close-button:hover {
          background: #eef1f5;
          color: #172033;
        }

        .modal-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding: 18px 21px 0;
        }

        .modal-detail-grid > div {
          padding: 13px;
          border: 1px solid #e7ebef;
          border-radius: 9px;
          background: #f9fafb;
        }

        .modal-detail-grid span,
        .modal-remarks > span {
          display: block;
          margin-bottom: 5px;
          color: #8993a1;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .modal-detail-grid strong {
          color: #263247;
          font-size: 11px;
          font-weight: 800;
        }

        .modal-present {
          color: #16734a !important;
        }

        .modal-absent {
          color: #8e2734 !important;
        }

        .modal-remarks {
          margin: 13px 21px 0;
          padding: 14px;
          border: 1px solid #e7ebef;
          border-radius: 9px;
          background: #ffffff;
        }

        .modal-remarks p {
          margin: 0;
          color: #4e5969;
          font-size: 10px;
          line-height: 1.6;
        }

        .modal-done-button {
          width: calc(100% - 42px);
          min-height: 39px;
          margin: 16px 21px 21px;
          border-radius: 8px;
          background: #172334;
          color: #ffffff;
          cursor: pointer;
          font-size: 10px;
          font-weight: 800;
        }

        .modal-done-button:hover {
          background: #20334b;
        }

        .attendance-loader {
          animation: attendance-spin 800ms linear infinite;
        }

        @keyframes attendance-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1050px) {
          .attendance-stat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .attendance-overview-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 760px) {
          .attendance-page-container {
            padding: 25px 18px 40px !important;
          }

          .attendance-page-header {
            align-items: flex-start !important;
            flex-direction: column !important;
          }

          .attendance-student-chip {
            width: 100%;
          }

          .attendance-hero-content {
            align-items: flex-start !important;
            flex-wrap: wrap;
          }

          .attendance-hero-percentage {
            width: 100%;
            margin-left: 0 !important;
            padding-top: 14px;
            border-top: 1px solid rgba(255,255,255,0.09);
            text-align: left !important;
          }

          .attendance-filter-row {
            align-items: stretch !important;
            flex-direction: column !important;
          }

          .attendance-filter-row > div {
            min-width: 0 !important;
          }

          .attendance-primary-button,
          .attendance-secondary-button {
            width: 100%;
          }

          .attendance-overview-inner {
            align-items: center !important;
            flex-direction: column !important;
            gap: 24px !important;
          }

          .attendance-overview-inner > div:last-child {
            width: 100%;
          }
        }

        @media (max-width: 520px) {
          .attendance-stat-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 9px !important;
          }

          .attendance-stat-card {
            min-height: 112px !important;
            padding: 14px !important;
          }

          .attendance-stat-card .stat-value {
            font-size: 21px !important;
          }

          .attendance-circle {
            width: 140px !important;
            height: 140px !important;
          }

          .attendance-circle > div {
            width: 108px !important;
            height: 108px !important;
          }

          .history-counts {
            display: none !important;
          }

          .attendance-modal-overlay {
            padding: 12px;
          }

          .modal-detail-grid {
            grid-template-columns: 1fr;
          }

          .attendance-page-header h1 {
            font-size: 26px !important;
          }
        }

        @media (max-width: 380px) {
          .attendance-stat-grid {
            grid-template-columns: 1fr !important;
          }

          .attendance-page-container {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
        }
      `}</style>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon,
  accent,
}: {
  label: string;
  value: string;
  description: string;
  icon: "percentage" | "present" | "absent" | "calendar";
  accent: string;
}) {
  return (
    <div className="attendance-stat-card">
      <div
        style={{
          position: "absolute",
          right: "-15px",
          top: "-15px",
          width: "65px",
          height: "65px",
          borderRadius: "50%",
          background: `${accent}0d`,
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "13px",
        }}
      >
        <span
          style={{
            color: "#758091",
            fontSize: "9px",
            fontWeight: 800,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>

        <span
          className="attendance-stat-icon"
          style={{
            background: `${accent}12`,
            color: accent,
          }}
        >
          {icon === "percentage" && (
            <span
              style={{
                fontSize: "13px",
                fontWeight: 900,
              }}
            >
              %
            </span>
          )}

          {icon === "present" && <CheckIcon size={14} />}

          {icon === "absent" && <CrossIcon size={14} />}

          {icon === "calendar" && <CalendarIcon size={14} />}
        </span>
      </div>

      <div
        className="stat-value"
        style={{
          position: "relative",
          color: "#172033",
          fontSize: "24px",
          lineHeight: 1,
          fontWeight: 900,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>

      <div
        style={{
          position: "relative",
          marginTop: "8px",
          color: "#8993a1",
          fontSize: "9px",
        }}
      >
        {description}
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  percentage,
  background,
}: {
  label: string;
  value: number;
  percentage: number;
  background: string;
}) {
  const safePercentage = Math.min(
    100,
    Math.max(0, percentage)
  );

  return (
    <div style={{ marginBottom: "15px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "6px",
        }}
      >
        <span
          style={{
            color: "#4e5969",
            fontSize: "9px",
            fontWeight: 700,
          }}
        >
          {label}
        </span>

        <span
          style={{
            color: "#263247",
            fontSize: "9px",
            fontWeight: 800,
          }}
        >
          {value}{" "}
          <span
            style={{
              color: "#9aa3af",
              fontWeight: 500,
            }}
          >
            ({safePercentage.toFixed(1)}%)
          </span>
        </span>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${safePercentage}%`,
            background,
          }}
        />
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="info-row">
      <span
        style={{
          color: "#8993a1",
          fontSize: "9px",
          fontWeight: 600,
        }}
      >
        {label}
      </span>

      <strong
        style={{
          color: highlight ? "#8b6c1f" : "#263247",
          fontSize: "9px",
          fontWeight: 800,
          textAlign: "right",
        }}
      >
        {value}
      </strong>
    </div>
  );
}
