"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LogoutButton from "@/components/logout-button";

type DashboardData = {
  students: {
    total: number;
    active: number;
  };

  registrations: {
    pending: number;
    approved: number;
    rejected: number;
  };

  branches: number;
};

type QuickAction = {
  number: string;
  title: string;
  description: string;
  href: string;
};

const quickActions: QuickAction[] = [
  {
    number: "01",
    title: "Registration Requests",
    description:
      "Review and approve student applications.",
    href: "/admin",
  },
  {
    number: "02",
    title: "Manage Students",
    description:
      "Create, edit and manage student records.",
    href: "/admin/students",
  },
  {
    number: "03",
    title: "Mark Attendance",
    description:
      "Record daily attendance for working days.",
    href: "/admin/attendance",
  },
  {
    number: "04",
    title: "Academic Calendar",
    description:
      "Configure semesters and academic days.",
    href: "/admin/calendar",
  },
  {
    number: "05",
    title: "Attendance Reports",
    description:
      "Generate monthly and semester reports.",
    href: "/admin/reports",
  },
];

function Card({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e1e7ef",
        borderRadius: 12,
        boxShadow:
          "0 3px 12px rgba(15, 23, 42, 0.04)",
      }}
    >
      {children}
    </section>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/dashboard",
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
            "Unable to load dashboard."
        );
        return;
      }

      setData(result.data);
    } catch {
      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const today =
    new Date().toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );

  const inactiveStudents = data
    ? Math.max(
        data.students.total -
          data.students.active,
        0
      )
    : 0;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#f4f6f9",
        color: "#172033",
      }}
    >
      {/* HEADER */}

      <header
        style={{
          minHeight: 76,
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          background: "#ffffff",
          borderBottom:
            "1px solid #e1e7ef",
          gap: 20,
        }}
      >
        <div>
          <div
            style={{
              color: "#7b8797",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing:
                "0.14em",
            }}
          >
            ACADEMIC ADMINISTRATION
          </div>

          <h1
            style={{
              margin: "4px 0 0",
              color: "#172033",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing:
                "-0.02em",
            }}
          >
            Dashboard
          </h1>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              textAlign: "right",
            }}
          >
            <div
              style={{
                color: "#9aa5b3",
                fontSize: 9,
                fontWeight: 700,
                textTransform:
                  "uppercase",
              }}
            >
              Today
            </div>

            <div
              style={{
                marginTop: 3,
                color: "#526071",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {today}
            </div>
          </div>

          <div
            style={{
              width: 1,
              height: 32,
              background: "#e1e7ef",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                background: "#172033",
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              A
            </div>

            <div>
              <div
                style={{
                  color: "#253247",
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                Administrator
              </div>

              <div
                style={{
                  marginTop: 2,
                  color: "#8a96a6",
                  fontSize: 9,
                }}
              >
                HOD / Admin
              </div>
            </div>
          </div>

          <LogoutButton />
        </div>
      </header>

      {/* CONTENT */}

      <div
        style={{
          width: "100%",
          maxWidth: 1450,
          margin: "0 auto",
          padding:
            "30px 32px 50px",
        }}
      >
        {/* WELCOME */}

        <section
          style={{
            marginBottom: 24,
            display: "flex",
            alignItems: "flex-end",
            justifyContent:
              "space-between",
            gap: 20,
          }}
        >
          <div>
            <div
              style={{
                color: "#8a96a6",
                fontSize: 9,
                fontWeight: 800,
                letterSpacing:
                  "0.13em",
              }}
            >
              COLLEGE ATTENDANCE
              MANAGEMENT
            </div>

            <h2
              style={{
                margin:
                  "6px 0 5px",
                color: "#172033",
                fontSize: 27,
                fontWeight: 800,
                letterSpacing:
                  "-0.03em",
              }}
            >
              Welcome back,
              Administrator
            </h2>

            <p
              style={{
                margin: 0,
                color: "#687588",
                fontSize: 13,
              }}
            >
              Manage students,
              attendance and
              academic records from
              one administration
              portal.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            style={{
              height: 38,
              padding: "0 14px",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              border:
                "1px solid #d7dee8",
              borderRadius: 8,
              background: "#ffffff",
              color: "#465367",
              cursor: loading
                ? "default"
                : "pointer",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            <span
              style={{
                fontSize: 17,
                display: "inline-block",
              }}
            >
              ↻
            </span>

            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </section>

        {/* ERROR */}

        {error && (
          <section
            style={{
              marginBottom: 22,
              padding:
                "14px 17px",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: 20,
              background: "#fff7f7",
              border:
                "1px solid #efcaca",
              borderLeft:
                "4px solid #a33a45",
              borderRadius: 9,
            }}
          >
            <div>
              <strong
                style={{
                  color: "#8d2634",
                  fontSize: 12,
                }}
              >
                Dashboard could not
                be loaded
              </strong>

              <p
                style={{
                  margin:
                    "4px 0 0",
                  color: "#a33a45",
                  fontSize: 11,
                }}
              >
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={loadDashboard}
              style={{
                height: 34,
                padding: "0 13px",
                border:
                  "1px solid #dfb9be",
                borderRadius: 7,
                background:
                  "#ffffff",
                color: "#8d2634",
                cursor: "pointer",
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              Try Again
            </button>
          </section>
        )}

        {/* LOADING */}

        {loading && !data && !error && (
          <Card>
            <div
              style={{
                minHeight: 250,
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",
                flexDirection:
                  "column",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  border:
                    "3px solid #e5eaf0",
                  borderTopColor:
                    "#172033",
                  borderRadius: "50%",
                  animation:
                    "dashboard-spin 0.8s linear infinite",
                }}
              />

              <span
                style={{
                  color: "#8995a5",
                  fontSize: 11,
                }}
              >
                Loading dashboard...
              </span>
            </div>
          </Card>
        )}

        {/* DASHBOARD */}

        {!loading && !error && data && (
          <>
            {/* KEY STATS */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(4, minmax(0, 1fr))",
                gap: 16,
                marginBottom: 22,
              }}
            >
              <Card>
                <div
                  style={{
                    padding: 20,
                  }}
                >
                  <div
                    style={{
                      color: "#7e8a9a",
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing:
                        "0.1em",
                    }}
                  >
                    TOTAL STUDENTS
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      color: "#172033",
                      fontSize: 30,
                      fontWeight: 800,
                    }}
                  >
                    {data.students.total}
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      color: "#8b97a6",
                      fontSize: 10,
                    }}
                  >
                    All registered
                    records
                  </div>
                </div>
              </Card>

              <Card>
                <div
                  style={{
                    padding: 20,
                  }}
                >
                  <div
                    style={{
                      color: "#7e8a9a",
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing:
                        "0.1em",
                    }}
                  >
                    ACTIVE STUDENTS
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      color: "#18794e",
                      fontSize: 30,
                      fontWeight: 800,
                    }}
                  >
                    {data.students.active}
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      color: "#8b97a6",
                      fontSize: 10,
                    }}
                  >
                    Currently enrolled
                  </div>
                </div>
              </Card>

              <Card>
                <div
                  style={{
                    padding: 20,
                  }}
                >
                  <div
                    style={{
                      color: "#7e8a9a",
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing:
                        "0.1em",
                    }}
                  >
                    PENDING REQUESTS
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      color:
                        data.registrations
                          .pending > 0
                          ? "#a56b05"
                          : "#172033",
                      fontSize: 30,
                      fontWeight: 800,
                    }}
                  >
                    {
                      data
                        .registrations
                        .pending
                    }
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      color: "#8b97a6",
                      fontSize: 10,
                    }}
                  >
                    Need administrator
                    review
                  </div>
                </div>
              </Card>

              <Card>
                <div
                  style={{
                    padding: 20,
                  }}
                >
                  <div
                    style={{
                      color: "#7e8a9a",
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing:
                        "0.1em",
                    }}
                  >
                    ACTIVE BRANCHES
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      color: "#172033",
                      fontSize: 30,
                      fontWeight: 800,
                    }}
                  >
                    {data.branches}
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      color: "#8b97a6",
                      fontSize: 10,
                    }}
                  >
                    Academic branches
                  </div>
                </div>
              </Card>
            </div>

            {/* ATTENDANCE CONTROL */}

            <Card>
              <div
                style={{
                  padding: 24,
                  background:
                    "#172033",
                  borderRadius: 12,
                  color: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "flex-start",
                    justifyContent:
                      "space-between",
                    gap: 20,
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: "#8f9bad",
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing:
                          "0.12em",
                      }}
                    >
                      ATTENDANCE CONTROL
                    </div>

                    <h3
                      style={{
                        margin:
                          "6px 0 4px",
                        fontSize: 20,
                        fontWeight: 800,
                      }}
                    >
                      Daily Attendance
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color:
                          "#9ba7b7",
                        fontSize: 11,
                      }}
                    >
                      Start or manage
                      attendance for an
                      academic working
                      day.
                    </p>
                  </div>

                  <div
                    style={{
                      padding:
                        "7px 10px",
                      border:
                        "1px solid #334155",
                      borderRadius: 7,
                      color: "#b5c0ce",
                      fontSize: 9,
                      fontWeight: 700,
                    }}
                  >
                    ADMINISTRATION
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 22,
                    paddingTop: 18,
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",
                    gap: 20,
                    borderTop:
                      "1px solid #2a374a",
                  }}
                >
                  <div>
                    <div
                      style={{
                        color:
                          "#8290a2",
                        fontSize: 9,
                        fontWeight: 700,
                      }}
                    >
                      ACTIVE STUDENTS
                    </div>

                    <strong
                      style={{
                        display:
                          "block",
                        marginTop: 4,
                        fontSize: 25,
                      }}
                    >
                      {
                        data.students
                          .active
                      }
                    </strong>
                  </div>

                  <div>
                    <div
                      style={{
                        color:
                          "#8290a2",
                        fontSize: 9,
                        fontWeight: 700,
                      }}
                    >
                      PENDING REQUESTS
                    </div>

                    <strong
                      style={{
                        display:
                          "block",
                        marginTop: 4,
                        color:
                          data
                            .registrations
                            .pending >
                          0
                            ? "#d4af37"
                            : "#ffffff",
                        fontSize: 25,
                      }}
                    >
                      {
                        data
                          .registrations
                          .pending
                      }
                    </strong>
                  </div>

                  <Link
                    href="/admin/attendance"
                    style={{
                      minHeight: 42,
                      padding:
                        "0 17px",
                      display:
                        "inline-flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      gap: 15,
                      border:
                        "1px solid #d4af37",
                      borderRadius: 8,
                      color: "#f0df9d",
                      background:
                        "rgba(212,175,55,0.08)",
                      textDecoration:
                        "none",
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    Open Attendance
                    <span
                      style={{
                        fontSize: 17,
                      }}
                    >
                      →
                    </span>
                  </Link>
                </div>
              </div>
            </Card>

            {/* INFORMATION */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: 18,
                marginTop: 22,
              }}
            >
              {/* STUDENTS */}

              <Card>
                <div
                  style={{
                    padding: 22,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems:
                        "flex-start",
                      justifyContent:
                        "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color:
                            "#8b97a6",
                          fontSize: 9,
                          fontWeight: 800,
                          letterSpacing:
                            "0.1em",
                        }}
                      >
                        STUDENT RECORDS
                      </div>

                      <h3
                        style={{
                          margin:
                            "5px 0 0",
                          color:
                            "#253247",
                          fontSize: 16,
                          fontWeight: 800,
                        }}
                      >
                        Student Overview
                      </h3>
                    </div>

                    <Link
                      href="/admin/students"
                      style={{
                        color:
                          "#596779",
                        fontSize: 10,
                        fontWeight: 700,
                        textDecoration:
                          "none",
                      }}
                    >
                      View all →
                    </Link>
                  </div>

                  <div
                    style={{
                      marginTop: 20,
                      display: "flex",
                      alignItems:
                        "center",
                      gap: 18,
                    }}
                  >
                    <strong
                      style={{
                        color:
                          "#172033",
                        fontSize: 42,
                        lineHeight: 1,
                      }}
                    >
                      {
                        data.students
                          .total
                      }
                    </strong>

                    <div>
                      <div
                        style={{
                          color:
                            "#344054",
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        Total Students
                      </div>

                      <div
                        style={{
                          marginTop: 3,
                          color:
                            "#8b97a6",
                          fontSize: 10,
                        }}
                      >
                        Registered student
                        records
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 20,
                      borderTop:
                        "1px solid #edf0f4",
                    }}
                  >
                    <div
                      style={{
                        minHeight: 40,
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "space-between",
                        borderBottom:
                          "1px solid #edf0f4",
                        color:
                          "#697688",
                        fontSize: 11,
                      }}
                    >
                      <span>
                        Active Students
                      </span>

                      <strong
                        style={{
                          color:
                            "#18794e",
                        }}
                      >
                        {
                          data
                            .students
                            .active
                        }
                      </strong>
                    </div>

                    <div
                      style={{
                        minHeight: 40,
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "space-between",
                        color:
                          "#697688",
                        fontSize: 11,
                      }}
                    >
                      <span>
                        Inactive Students
                      </span>

                      <strong
                        style={{
                          color:
                            "#687588",
                        }}
                      >
                        {inactiveStudents}
                      </strong>
                    </div>
                  </div>
                </div>
              </Card>

              {/* REGISTRATIONS */}

              <Card>
                <div
                  style={{
                    padding: 22,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems:
                        "flex-start",
                      justifyContent:
                        "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color:
                            "#8b97a6",
                          fontSize: 9,
                          fontWeight: 800,
                          letterSpacing:
                            "0.1em",
                        }}
                      >
                        REGISTRATION
                      </div>

                      <h3
                        style={{
                          margin:
                            "5px 0 0",
                          color:
                            "#253247",
                          fontSize: 16,
                          fontWeight: 800,
                        }}
                      >
                        Student Applications
                      </h3>
                    </div>

                    <Link
                      href="/admin"
                      style={{
                        color:
                          "#596779",
                        fontSize: 10,
                        fontWeight: 700,
                        textDecoration:
                          "none",
                      }}
                    >
                      Review →
                    </Link>
                  </div>

                  <div
                    style={{
                      marginTop: 15,
                    }}
                  >
                    {[
                      {
                        label:
                          "Pending",
                        value:
                          data
                            .registrations
                            .pending,
                        color:
                          "#a56b05",
                      },
                      {
                        label:
                          "Approved",
                        value:
                          data
                            .registrations
                            .approved,
                        color:
                          "#18794e",
                      },
                      {
                        label:
                          "Rejected",
                        value:
                          data
                            .registrations
                            .rejected,
                        color:
                          "#a33a45",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        style={{
                          minHeight: 43,
                          display: "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "space-between",
                          borderBottom:
                            "1px solid #edf0f4",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems:
                              "center",
                            gap: 9,
                            color:
                              "#697688",
                            fontSize: 11,
                          }}
                        >
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius:
                                "50%",
                              background:
                                item.color,
                            }}
                          />

                          {item.label}
                        </div>

                        <strong
                          style={{
                            color:
                              item.color,
                            fontSize: 13,
                          }}
                        >
                          {item.value}
                        </strong>
                      </div>
                    ))}
                  </div>

                  {data.registrations
                    .pending > 0 && (
                    <Link
                      href="/admin"
                      style={{
                        marginTop: 12,
                        padding:
                          "10px 12px",
                        display: "flex",
                        alignItems:
                          "center",
                        gap: 10,
                        background:
                          "#fffaf0",
                        border:
                          "1px solid #eee1bd",
                        borderRadius: 8,
                        color:
                          "#72571b",
                        textDecoration:
                          "none",
                      }}
                    >
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          borderRadius:
                            "50%",
                          background:
                            "#f4e7bc",
                          fontWeight: 900,
                        }}
                      >
                        !
                      </span>

                      <span
                        style={{
                          display:
                            "flex",
                          flexDirection:
                            "column",
                          gap: 2,
                        }}
                      >
                        <strong
                          style={{
                            fontSize: 10,
                          }}
                        >
                          Attention required
                        </strong>

                        <small
                          style={{
                            color:
                              "#9b8753",
                            fontSize: 9,
                          }}
                        >
                          {
                            data
                              .registrations
                              .pending
                          }{" "}
                          application
                          {data
                            .registrations
                            .pending !==
                          1
                            ? "s"
                            : ""}{" "}
                          waiting for
                          review
                        </small>
                      </span>

                      <span
                        style={{
                          marginLeft:
                            "auto",
                        }}
                      >
                        →
                      </span>
                    </Link>
                  )}
                </div>
              </Card>
            </div>

            {/* QUICK ACCESS */}

            <section
              style={{
                marginTop: 26,
              }}
            >
              <div
                style={{
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    color: "#8b97a6",
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing:
                      "0.1em",
                  }}
                >
                  ADMINISTRATION
                </div>

                <h3
                  style={{
                    margin:
                      "5px 0 0",
                    color:
                      "#253247",
                    fontSize: 17,
                    fontWeight: 800,
                  }}
                >
                  Quick Access
                </h3>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(5, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                {quickActions.map(
                  (action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      style={{
                        minHeight: 120,
                        padding: 17,
                        position:
                          "relative",
                        display:
                          "flex",
                        flexDirection:
                          "column",
                        background:
                          "#ffffff",
                        border:
                          "1px solid #e1e7ef",
                        borderRadius: 10,
                        color:
                          "#172033",
                        textDecoration:
                          "none",
                        boxShadow:
                          "0 2px 8px rgba(15,23,42,0.03)",
                      }}
                    >
                      <span
                        style={{
                          color:
                            "#a2adba",
                          fontSize: 9,
                          fontWeight: 800,
                        }}
                      >
                        {action.number}
                      </span>

                      <strong
                        style={{
                          marginTop: 14,
                          paddingRight: 15,
                          color:
                            "#344054",
                          fontSize: 11,
                          lineHeight:
                            1.4,
                        }}
                      >
                        {action.title}
                      </strong>

                      <span
                        style={{
                          marginTop: 5,
                          paddingRight: 15,
                          color:
                            "#909aaa",
                          fontSize: 9,
                          lineHeight:
                            1.5,
                        }}
                      >
                        {
                          action.description
                        }
                      </span>

                      <span
                        style={{
                          position:
                            "absolute",
                          right: 14,
                          bottom: 12,
                          color:
                            "#657184",
                          fontSize: 15,
                        }}
                      >
                        →
                      </span>
                    </Link>
                  )
                )}
              </div>
            </section>

            {/* FOOTER */}

            <footer
              style={{
                marginTop: 32,
                paddingTop: 16,
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                borderTop:
                  "1px solid #dde3ea",
                color: "#98a2af",
                fontSize: 9,
              }}
            >
              <span>
                College Attendance
                Management System
              </span>

              <span>
                Institutional ERP
                Portal
              </span>
            </footer>
          </>
        )}
      </div>

      <style>
        {`
          @keyframes dashboard-spin {
            to {
              transform: rotate(360deg);
            }
          }

          @media (max-width: 1100px) {
            .dashboard-page-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 800px) {
            .dashboard-mobile-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </div>
  );
}