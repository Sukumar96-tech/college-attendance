import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStudentAttendanceSummary } from "@/lib/attendance";

export default async function StudentDashboardPage() {
  const session = await getSession();

  // User must be logged in
  if (!session) {
    redirect("/login");
  }

  // Only students can access this dashboard
  if (session.role !== "STUDENT") {
    redirect("/admin/dashboard");
  }

  // Get the logged-in student's account and profile
  const user = await db.user.findUnique({
    where: {
      id: session.userId,
    },

    include: {
      student: {
        include: {
          branch: true,
          studyYear: true,
        },
      },
    },
  });

  // Account not found
  if (!user) {
    redirect("/login");
  }

  // Student must be approved and active
  if (
    user.status !== "APPROVED" ||
    !user.student ||
    !user.student.isActive
  ) {
    redirect("/login");
  }

  const student = user.student;

  // Get attendance summary for the logged-in student
  const summary =
    await getStudentAttendanceSummary(student.id);

  // Validate summary before displaying it
  const attendanceDataIsValid =
    summary.totalWorkingDays >= 0 &&
    summary.presentDays >= 0 &&
    summary.absentDays >= 0 &&
    summary.presentDays <=
      summary.totalWorkingDays &&
    summary.absentDays <=
      summary.totalWorkingDays &&
    summary.presentDays +
      summary.absentDays ===
      summary.totalWorkingDays;

  const safePercentage =
    attendanceDataIsValid
      ? Math.min(
          100,
          Math.max(
            0,
            summary.percentage
          )
        )
      : 0;

  const attendanceStatus =
    safePercentage >= 75
      ? {
          label: "Good Attendance",
          description:
            "Your attendance is above the recommended level.",
          background: "#ecfdf3",
          color: "#16734a",
          border: "#b7ebcd",
        }
      : safePercentage >= 65
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
        minHeight: "100vh",
        background: "#f4f6f9",
        color: "#172033",
      }}
    >
      {/* =========================================================
          PAGE CONTENT
      ========================================================= */}

      <div
        style={{
          width: "100%",
          maxWidth: "1380px",
          margin: "0 auto",
          padding: "32px 30px 50px",
        }}
      >
        {/* PAGE INTRODUCTION */}

        <section
          style={{
            marginBottom: "26px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "20px",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                marginBottom: "9px",
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
                margin: 0,
                color: "#172033",
                fontSize: "30px",
                lineHeight: 1.15,
                fontWeight: 800,
                letterSpacing: "-0.025em",
              }}
            >
              Welcome back, {student.name}
            </h1>

            <p
              style={{
                margin: "8px 0 0",
                color: "#687386",
                fontSize: "14px",
              }}
            >
              Here is your academic and attendance
              overview.
            </p>
          </div>

          <div
            className="welcome-status"
            style={{
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: "9px",
              border: "1px solid #dfe4ea",
              borderRadius: "10px",
              background: "#ffffff",
              boxShadow:
                "0 4px 15px rgba(15,23,42,0.04)",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#4ade80",
                boxShadow:
                  "0 0 0 4px rgba(74,222,128,0.12)",
              }}
            />

            <span
              style={{
                color: "#4d596a",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              Active Student
            </span>
          </div>
        </section>

        {/* =========================================================
            STUDENT IDENTITY CARD
        ========================================================= */}

        <section
          style={{
            position: "relative",
            overflow: "hidden",
            marginBottom: "22px",
            padding: "26px 28px",
            borderRadius: "16px",
            background:
              "linear-gradient(135deg, #172334 0%, #20334b 100%)",
            color: "#ffffff",
            boxShadow:
              "0 12px 30px rgba(15,23,42,0.13)",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "240px",
              height: "240px",
              right: "-70px",
              top: "-100px",
              borderRadius: "50%",
              border:
                "1px solid rgba(199,164,67,0.16)",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: "160px",
              height: "160px",
              right: "45px",
              bottom: "-110px",
              borderRadius: "50%",
              border:
                "1px solid rgba(255,255,255,0.06)",
            }}
          />

          <div
            className="student-identity-content"
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <div
              style={{
                width: "66px",
                height: "66px",
                flexShrink: 0,
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#c7a443",
                color: "#172334",
                fontSize: "22px",
                fontWeight: 900,
                boxShadow:
                  "0 8px 20px rgba(0,0,0,0.16)",
              }}
            >
              {student.name
                .charAt(0)
                .toUpperCase()}
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  marginBottom: "5px",
                  color: "#9ca9b9",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Student Profile
              </div>

              <h2
                style={{
                  margin: 0,
                  color: "#ffffff",
                  fontSize: "22px",
                  lineHeight: 1.2,
                  fontWeight: 800,
                }}
              >
                {student.name}
              </h2>

              <div
                style={{
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px",
                  color: "#b9c4d0",
                  fontSize: "11px",
                }}
              >
                <span>
                  {student.hallTicket}
                </span>

                <span
                  style={{
                    color: "#526276",
                  }}
                >
                  •
                </span>

                <span>
                  {student.branch.name}
                </span>

                <span
                  style={{
                    color: "#526276",
                  }}
                >
                  •
                </span>

                <span>
                  {student.studyYear.name}
                </span>
              </div>
            </div>

            <div
              className="identity-actions"
              style={{
                marginLeft: "auto",
                display: "flex",
                gap: "9px",
              }}
            >
              <Link
                href="/student/profile"
                style={{
                  minHeight: "38px",
                  padding: "0 14px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  border:
                    "1px solid rgba(255,255,255,0.12)",
                  background:
                    "rgba(255,255,255,0.06)",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                View Profile
              </Link>

              <Link
                href="/student/attendance"
                style={{
                  minHeight: "38px",
                  padding: "0 14px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  background: "#c7a443",
                  color: "#172334",
                  textDecoration: "none",
                  fontSize: "11px",
                  fontWeight: 800,
                }}
              >
                My Attendance
              </Link>
            </div>
          </div>
        </section>

        {/* INVALID DATA WARNING */}

        {!attendanceDataIsValid && (
          <section
            style={{
              marginBottom: "22px",
              padding: "14px 16px",
              border:
                "1px solid #efc1c6",
              borderRadius: "10px",
              background: "#fff0f1",
              color: "#8e2734",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span
                style={{
                  width: "24px",
                  height: "24px",
                  flexShrink: 0,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#8e2734",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 900,
                }}
              >
                !
              </span>

              <div>
                <strong
                  style={{
                    display: "block",
                    fontSize: "12px",
                    marginBottom: "2px",
                  }}
                >
                  Attendance data warning
                </strong>

                <span
                  style={{
                    fontSize: "11px",
                  }}
                >
                  Attendance summary could not be
                  validated. Please contact the
                  administrator.
                </span>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================
            STATISTICS
        ========================================================= */}

        <section
          className="student-stats-grid"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: "16px",
            marginBottom: "22px",
          }}
        >
          <StatCard
            label="Attendance"
            value={`${safePercentage.toFixed(1)}%`}
            description="Overall percentage"
            icon="percentage"
            accent="#c7a443"
          />

          <StatCard
            label="Present Days"
            value={String(summary.presentDays)}
            description="Days attended"
            icon="present"
            accent="#248653"
          />

          <StatCard
            label="Absent Days"
            value={String(summary.absentDays)}
            description="Days missed"
            icon="absent"
            accent="#9b3442"
          />

          <StatCard
            label="Working Days"
            value={String(summary.totalWorkingDays)}
            description="Completed days"
            icon="calendar"
            accent="#496b91"
          />
        </section>

        {/* =========================================================
            ATTENDANCE OVERVIEW + ACADEMIC INFORMATION
        ========================================================= */}

        <section
          className="student-main-grid"
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1.45fr) minmax(340px, 0.9fr)",
            gap: "20px",
            marginBottom: "22px",
          }}
        >
          {/* ATTENDANCE OVERVIEW */}

          <div
            style={{
              padding: "25px",
              border:
                "1px solid #e0e5eb",
              borderRadius: "15px",
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
                gap: "15px",
                marginBottom: "24px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "#172033",
                    fontSize: "17px",
                    fontWeight: 800,
                  }}
                >
                  Attendance Overview
                </h2>

                <p
                  style={{
                    margin:
                      "5px 0 0",
                    color: "#7a8594",
                    fontSize: "11px",
                  }}
                >
                  Based on completed working days
                </p>
              </div>

              <span
                style={{
                  padding:
                    "6px 9px",
                  borderRadius: "6px",
                  background:
                    attendanceStatus.background,
                  color:
                    attendanceStatus.color,
                  border:
                    `1px solid ${attendanceStatus.border}`,
                  fontSize: "9px",
                  fontWeight: 800,
                  whiteSpace:
                    "nowrap",
                }}
              >
                {attendanceStatus.label}
              </span>
            </div>

            <div
              className="attendance-overview-content"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "42px",
              }}
            >
              {/* CIRCLE */}

              <div
                style={{
                  position: "relative",
                  width: "168px",
                  height: "168px",
                  flexShrink: 0,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `conic-gradient(#c7a443 ${safePercentage * 3.6}deg, #e9edf1 0deg)`,
                  boxShadow:
                    "0 7px 20px rgba(15,23,42,0.07)",
                }}
              >
                <div
                  style={{
                    width: "130px",
                    height: "130px",
                    borderRadius: "50%",
                    display: "flex",
                    flexDirection:
                      "column",
                    alignItems: "center",
                    justifyContent:
                      "center",
                    background:
                      "#ffffff",
                  }}
                >
                  <span
                    style={{
                      color: "#172033",
                      fontSize: "27px",
                      lineHeight: 1,
                      fontWeight: 900,
                    }}
                  >
                    {safePercentage.toFixed(
                      1
                    )}
                    %
                  </span>

                  <span
                    style={{
                      marginTop:
                        "6px",
                      color:
                        "#7a8594",
                      fontSize: "9px",
                      fontWeight: 700,
                    }}
                  >
                    ATTENDANCE
                  </span>
                </div>
              </div>

              {/* BARS */}

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <AttendanceBar
                  label="Present"
                  value={summary.presentDays}
                  percentage={presentPercentage}
                  background="#248653"
                />

                <AttendanceBar
                  label="Absent"
                  value={summary.absentDays}
                  percentage={absentPercentage}
                  background="#9b3442"
                />

                <div
                  style={{
                    marginTop: "22px",
                    paddingTop: "16px",
                    borderTop:
                      "1px solid #edf0f3",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                    }}
                  >
                    <span
                      style={{
                        color:
                          "#7a8594",
                        fontSize:
                          "10px",
                        fontWeight:
                          600,
                      }}
                    >
                      Completed working days
                    </span>

                    <strong
                      style={{
                        color:
                          "#172033",
                        fontSize:
                          "12px",
                      }}
                    >
                      {
                        summary.totalWorkingDays
                      }
                    </strong>
                  </div>

                  <p
                    style={{
                      margin:
                        "8px 0 0",
                      color:
                        attendanceStatus.color,
                      fontSize:
                        "10px",
                      lineHeight:
                        1.5,
                    }}
                  >
                    {
                      attendanceStatus.description
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ACADEMIC INFORMATION */}

          <div
            style={{
              padding: "25px",
              border:
                "1px solid #e0e5eb",
              borderRadius: "15px",
              background: "#ffffff",
              boxShadow:
                "0 5px 20px rgba(15,23,42,0.045)",
            }}
          >
            <div
              style={{
                marginBottom: "20px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#172033",
                  fontSize: "17px",
                  fontWeight: 800,
                }}
              >
                Academic Information
              </h2>

              <p
                style={{
                  margin:
                    "5px 0 0",
                  color: "#7a8594",
                  fontSize: "11px",
                }}
              >
                Your current academic details
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gap: "1px",
                border:
                  "1px solid #e7ebef",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <InfoRow
                label="Hall Ticket"
                value={
                  student.hallTicket
                }
                highlight
              />

              <InfoRow
                label="Student Name"
                value={
                  student.name
                }
              />

              <InfoRow
                label="Branch"
                value={
                  student.branch.name
                }
              />

              <InfoRow
                label="Branch Code"
                value={
                  student.branch.code
                }
              />

              <InfoRow
                label="Study Year"
                value={
                  student.studyYear.name
                }
              />
            </div>
          </div>
        </section>

        {/* =========================================================
            QUICK ACCESS
        ========================================================= */}

        <section>
          <div
            style={{
              marginBottom: "13px",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#172033",
                fontSize: "17px",
                fontWeight: 800,
              }}
            >
              Quick Access
            </h2>

            <p
              style={{
                margin:
                  "4px 0 0",
                color: "#7a8594",
                fontSize: "11px",
              }}
            >
              Manage your student portal
            </p>
          </div>

          <div
            className="quick-access-grid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "16px",
            }}
          >
            <QuickAccessCard
              href="/student/attendance"
              icon="attendance"
              title="My Attendance"
              description="View your complete attendance history and records."
            />

            <QuickAccessCard
              href="/student/profile"
              icon="profile"
              title="My Profile"
              description="View your personal and academic information."
            />
          </div>
        </section>

        {/* =========================================================
            FOOTER
        ========================================================= */}

        <footer
          style={{
            marginTop: "38px",
            paddingTop: "20px",
            borderTop:
              "1px solid #e0e5eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "15px",
            color: "#8993a1",
            fontSize: "10px",
          }}
        >
          <span>
            College Attendance Management
            System
          </span>

          <span>
            Student Portal
          </span>
        </footer>
      </div>

      {/* =========================================================
          RESPONSIVE STYLES
      ========================================================= */}

      <style>{`
        .student-nav-link {
          position: relative;
          min-height: 44px;
          padding: 0 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 9px;
          color: #b9c4d1;
          text-decoration: none;
          font-size: 11px;
          font-weight: 600;
          transition:
            background 160ms ease,
            color 160ms ease;
        }

        .student-nav-link:hover {
          color: #ffffff;
          background: rgba(255,255,255,0.06);
        }

        .student-nav-active {
          color: #ffffff;
          background: rgba(199,164,67,0.14);
        }

        .student-nav-active::after {
          content: "";
          position: absolute;
          left: 13px;
          right: 13px;
          bottom: 0;
          height: 2px;
          border-radius: 3px 3px 0 0;
          background: #c7a443;
        }

        .student-mobile-nav {
          display: none;
        }

        .stat-card {
          transition:
            transform 160ms ease,
            box-shadow 160ms ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow:
            0 10px 25px rgba(15,23,42,0.08) !important;
        }

        .quick-access-card {
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            box-shadow 160ms ease;
        }

        .quick-access-card:hover {
          transform: translateY(-2px);
          border-color: #d4c17e !important;
          box-shadow:
            0 10px 25px rgba(15,23,42,0.07) !important;
        }

        @media (max-width: 1100px) {
          .student-navbar {
            padding-left: 20px !important;
            padding-right: 20px !important;
          }

          .student-nav-link {
            padding-left: 9px !important;
            padding-right: 9px !important;
          }

          .student-main-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 900px) {
          .student-desktop-nav {
            display: none !important;
          }

          .student-mobile-nav {
            padding: 9px 14px 12px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 5px;
            border-top: 1px solid rgba(255,255,255,0.07);
            background: #14202f;
          }

          .student-mobile-nav-link {
            min-height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            border-radius: 8px;
            color: #9ca9b8;
            text-decoration: none;
            font-size: 10px;
            font-weight: 700;
          }

          .student-mobile-nav-link.active {
            background: rgba(199,164,67,0.13);
            color: #ffffff;
          }

          .student-navbar {
            min-height: 68px !important;
          }

          .student-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .student-nav-profile {
            margin-left: auto;
          }
        }

        @media (max-width: 650px) {
          .student-navbar {
            padding-left: 14px !important;
            padding-right: 14px !important;
          }

          .student-brand-text {
            display: none;
          }

          .student-nav-details {
            display: none;
          }

          .student-nav-profile > div:first-child {
            display: none;
          }

          .student-logout {
            margin-left: 2px;
          }

          .welcome-status {
            display: none !important;
          }

          .student-identity-content {
            align-items: flex-start !important;
            flex-wrap: wrap;
          }

          .identity-actions {
            width: 100%;
            margin-left: 0 !important;
          }

          .identity-actions a {
            flex: 1;
          }

          .student-stats-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }

          .student-stats-grid > div {
            padding: 16px !important;
          }

          .attendance-overview-content {
            flex-direction: column !important;
            gap: 25px !important;
          }

          .attendance-overview-content > div:last-child {
            width: 100%;
          }

          .quick-access-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 480px) {
          .student-stats-grid {
            grid-template-columns: 1fr !important;
          }

          .student-navbar {
            min-height: 64px !important;
          }

          .student-mobile-nav {
            grid-template-columns: repeat(3, 1fr);
          }

          .student-mobile-nav-link span {
            font-size: 9px;
          }
        }
      `}</style>
    </main>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  description,
  icon,
  accent,
}: {
  label: string;
  value: string;
  description: string;
  icon:
    | "percentage"
    | "present"
    | "absent"
    | "calendar";
  accent: string;
}) {
  return (
    <div
      className="stat-card"
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "138px",
        padding: "20px",
        border:
          "1px solid #e0e5eb",
        borderRadius: "14px",
        background: "#ffffff",
        boxShadow:
          "0 5px 20px rgba(15,23,42,0.045)",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: "-15px",
          top: "-15px",
          width: "70px",
          height: "70px",
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
          marginBottom: "15px",
        }}
      >
        <span
          style={{
            color: "#758091",
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>

        <span
          style={{
            width: "30px",
            height: "30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
            background: `${accent}12`,
            color: accent,
          }}
        >
          {icon === "percentage" && (
            <span
              style={{
                fontSize: "14px",
                fontWeight: 900,
              }}
            >
              %
            </span>
          )}

          {icon === "present" && (
            <CheckIcon />
          )}

          {icon === "absent" && (
            <CrossIcon />
          )}

          {icon === "calendar" && (
            <CalendarIcon />
          )}
        </span>
      </div>

      <div
        style={{
          position: "relative",
          color: "#172033",
          fontSize: "26px",
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
          marginTop: "9px",
          color: "#8993a1",
          fontSize: "10px",
          fontWeight: 500,
        }}
      >
        {description}
      </div>
    </div>
  );
}

/* =========================================================
   ATTENDANCE BAR
========================================================= */

function AttendanceBar({
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
  return (
    <div
      style={{
        marginBottom: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "7px",
        }}
      >
        <span
          style={{
            color: "#4e5969",
            fontSize: "10px",
            fontWeight: 700,
          }}
        >
          {label}
        </span>

        <span
          style={{
            color: "#172033",
            fontSize: "10px",
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
            ({percentage.toFixed(1)}%)
          </span>
        </span>
      </div>

      <div
        style={{
          width: "100%",
          height: "7px",
          overflow: "hidden",
          borderRadius: "20px",
          background: "#edf0f3",
        }}
      >
        <div
          style={{
            width: `${Math.min(
              100,
              Math.max(0, percentage)
            )}%`,
            height: "100%",
            borderRadius: "20px",
            background,
            transition: "width 400ms ease",
          }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

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
    <div
      style={{
        minHeight: "43px",
        padding: "0 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "15px",
        background: "#ffffff",
        borderBottom:
          "1px solid #edf0f3",
      }}
    >
      <span
        style={{
          color: "#8993a1",
          fontSize: "10px",
          fontWeight: 600,
        }}
      >
        {label}
      </span>

      <strong
        style={{
          color: highlight
            ? "#8b6c1f"
            : "#263247",
          fontSize: "10px",
          fontWeight: 800,
          textAlign: "right",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

/* =========================================================
   QUICK ACCESS CARD
========================================================= */

function QuickAccessCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: "attendance" | "profile";
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="quick-access-card"
      style={{
        minHeight: "112px",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        border:
          "1px solid #e0e5eb",
        borderRadius: "14px",
        background: "#ffffff",
        boxShadow:
          "0 5px 20px rgba(15,23,42,0.045)",
        textDecoration: "none",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "11px",
          background:
            "rgba(199,164,67,0.12)",
          color: "#a27f20",
        }}
      >
        {icon === "attendance" ? (
          <AttendanceIcon size={20} />
        ) : (
          <ProfileIcon size={20} />
        )}
      </div>

      <div
        style={{
          minWidth: 0,
          flex: 1,
        }}
      >
        <h3
          style={{
            margin: 0,
            color: "#172033",
            fontSize: "13px",
            fontWeight: 800,
          }}
        >
          {title}
        </h3>

        <p
          style={{
            margin: "5px 0 0",
            color: "#7b8695",
            fontSize: "10px",
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      </div>

      <span
        style={{
          color: "#c7a443",
          fontSize: "18px",
          fontWeight: 400,
        }}
      >
        →
      </span>
    </Link>
  );
}

/* =========================================================
   ICONS
========================================================= */

function DashboardIcon({
  size = 17,
}: {
  size?: number;
}) {
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
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1"
      />
      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1"
      />
      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1"
      />
    </svg>
  );
}

function AttendanceIcon({
  size = 17,
}: {
  size?: number;
}) {
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
      <rect
        x="4"
        y="3"
        width="16"
        height="18"
        rx="2"
      />
      <path d="M8 3v3" />
      <path d="M16 3v3" />
      <path d="M4 9h16" />
      <path d="m8 14 2 2 5-5" />
    </svg>
  );
}

function ProfileIcon({
  size = 17,
}: {
  size?: number;
}) {
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
      <circle
        cx="12"
        cy="8"
        r="3.5"
      />
      <path d="M4 21c.8-4.1 3.5-6.2 8-6.2s7.2 2.1 8 6.2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="17"
        rx="2"
      />
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M3 9h18" />
    </svg>
  );
}