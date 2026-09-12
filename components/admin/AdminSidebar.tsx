"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type IconName =
  | "dashboard"
  | "registration"
  | "students"
  | "attendance"
  | "calendar"
  | "reports"
  | "settings"
  | "logout";

const navigationItems: {
  name: string;
  href: string;
  icon: IconName;
}[] = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: "dashboard",
  },
  {
    name: "Requests",
    href: "/admin",
    icon: "registration",
  },
  {
    name: "Students",
    href: "/admin/students",
    icon: "students",
  },
  {
    name: "Attendance",
    href: "/admin/attendance",
    icon: "attendance",
  },
  {
    name: "Calendar",
    href: "/admin/calendar",
    icon: "calendar",
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: "reports",
  },
];

function Icon({
  name,
  size = 18,
}: {
  name: IconName;
  size?: number;
}) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...commonProps}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );

    case "registration":
      return (
        <svg {...commonProps}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 20c.7-3.3 2.5-5 5.5-5s4.8 1.7 5.5 5" />
          <path d="M18 8v6" />
          <path d="M15 11h6" />
        </svg>
      );

    case "students":
      return (
        <svg {...commonProps}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 20c.7-3.3 2.5-5 5.5-5s4.8 1.7 5.5 5" />
          <path d="M16 5.5a3 3 0 0 1 0 5.8" />
          <path d="M17 15.2c1.8.7 3 2.2 3.5 4.8" />
        </svg>
      );

    case "attendance":
      return (
        <svg {...commonProps}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 3v3" />
          <path d="M16 3v3" />
          <path d="M4 9h16" />
          <path d="m8 14 2 2 5-5" />
        </svg>
      );

    case "calendar":
      return (
        <svg {...commonProps}>
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 9h18" />
          <path d="M8 13h.01" />
          <path d="M12 13h.01" />
          <path d="M16 13h.01" />
          <path d="M8 17h.01" />
          <path d="M12 17h.01" />
        </svg>
      );

    case "reports":
      return (
        <svg {...commonProps}>
          <path d="M4 20V10" />
          <path d="M10 20V4" />
          <path d="M16 20v-7" />
          <path d="M22 20H2" />
        </svg>
      );

    case "settings":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20h-2.5v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.5-1H6v-2.5h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V5h2.5v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1V14h-.1a1.7 1.7 0 0 0-1.5 1Z" />
        </svg>
      );

    case "logout":
      return (
        <svg {...commonProps}>
          <path d="M10 17l5-5-5-5" />
          <path d="M15 12H3" />
          <path d="M21 3v18" />
        </svg>
      );
  }
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 180ms ease",
      }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function isNavigationActive(
  pathname: string,
  href: string
) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          width: "100%",
          background: "#172334",
          borderBottom:
            "1px solid rgba(255,255,255,0.08)",
          boxShadow:
            "0 8px 30px rgba(15,23,42,0.12)",
        }}
      >
        <div
          style={{
            minHeight: "76px",
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            gap: "24px",
          }}
        >
          {/* BRAND */}
          <Link
            href="/admin/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              textDecoration: "none",
              color: "#ffffff",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "11px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#c7a443",
                color: "#172334",
                fontSize: "13px",
                fontWeight: 900,
                letterSpacing: "0.03em",
                boxShadow:
                  "0 5px 18px rgba(199,164,67,0.20)",
              }}
            >
              CA
            </div>

            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 900,
                  letterSpacing: "0.13em",
                  lineHeight: 1.1,
                }}
              >
                COLLEGE
              </div>

              <div
                style={{
                  marginTop: "4px",
                  color: "#aeb9c7",
                  fontSize: "11px",
                  fontWeight: 500,
                }}
              >
                Attendance ERP
              </div>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            {navigationItems.map((item) => {
              const active =
                isNavigationActive(
                  pathname,
                  item.href
                );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={
                    active ? "page" : undefined
                  }
                  style={{
                    position: "relative",
                    minHeight: "44px",
                    padding: "0 13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    borderRadius: "9px",
                    color: active
                      ? "#ffffff"
                      : "#b9c4d1",
                    background: active
                      ? "rgba(199,164,67,0.14)"
                      : "transparent",
                    textDecoration: "none",
                    fontSize: "12px",
                    fontWeight: active ? 700 : 600,
                    transition:
                      "background 160ms ease, color 160ms ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: active
                        ? "#c7a443"
                        : "#8794a5",
                    }}
                  >
                    <Icon
                      name={item.icon}
                      size={17}
                    />
                  </span>

                  <span>{item.name}</span>

                  {item.name === "Requests" && (
                    <span
                      style={{
                        width: "17px",
                        height: "17px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#8e2734",
                        color: "#ffffff",
                        fontSize: "9px",
                        fontWeight: 900,
                      }}
                    >
                      !
                    </span>
                  )}

                  {active && (
                    <span
                      style={{
                        position: "absolute",
                        left: "12px",
                        right: "12px",
                        bottom: "-1px",
                        height: "2px",
                        borderRadius:
                          "3px 3px 0 0",
                        background: "#c7a443",
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ADMIN AREA */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexShrink: 0,
            }}
          >
            <Link
              href="/admin/settings"
              aria-label="Settings"
              style={{
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "9px",
                color:
                  pathname.startsWith(
                    "/admin/settings"
                  )
                    ? "#c7a443"
                    : "#9aa7b6",
                background:
                  pathname.startsWith(
                    "/admin/settings"
                  )
                    ? "rgba(199,164,67,0.12)"
                    : "rgba(255,255,255,0.04)",
                textDecoration: "none",
              }}
            >
              <Icon
                name="settings"
                size={18}
              />
            </Link>

            <div
              style={{
                width: "1px",
                height: "30px",
                background:
                  "rgba(255,255,255,0.10)",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
              }}
            >
              <div
                style={{
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#c7a443",
                    color: "#172334",
                    fontSize: "13px",
                    fontWeight: 900,
                  }}
                >
                  A
                </div>

                <span
                  style={{
                    position: "absolute",
                    right: "-1px",
                    bottom: "0",
                    width: "9px",
                    height: "9px",
                    borderRadius: "50%",
                    background: "#4ade80",
                    border:
                      "2px solid #172334",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1px",
                }}
              >
                <span
                  style={{
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  Administrator
                </span>

                <span
                  style={{
                    color: "#8996a6",
                    fontSize: "9px",
                    fontWeight: 500,
                  }}
                >
                  HOD / Admin
                </span>
              </div>
            </div>

            {/* MOBILE MENU BUTTON */}
            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(
                  (current) => !current
                )
              }
              aria-label="Toggle navigation"
              style={{
                display: "none",
                width: "40px",
                height: "40px",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "9px",
                background:
                  "rgba(255,255,255,0.07)",
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              <ChevronIcon
                open={mobileMenuOpen}
              />
            </button>
          </div>
        </div>

        {/* MOBILE NAVIGATION */}
        {mobileMenuOpen && (
          <div
            style={{
              padding: "10px 18px 18px",
              borderTop:
                "1px solid rgba(255,255,255,0.07)",
              background: "#14202f",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "6px",
              }}
            >
              {navigationItems.map((item) => {
                const active =
                  isNavigationActive(
                    pathname,
                    item.href
                  );

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() =>
                      setMobileMenuOpen(false)
                    }
                    style={{
                      minHeight: "48px",
                      padding: "0 13px",
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      borderRadius: "9px",
                      color: active
                        ? "#ffffff"
                        : "#b9c4d1",
                      background: active
                        ? "rgba(199,164,67,0.14)"
                        : "rgba(255,255,255,0.025)",
                      textDecoration: "none",
                      fontSize: "12px",
                      fontWeight: active
                        ? 700
                        : 600,
                    }}
                  >
                    <Icon
                      name={item.icon}
                      size={17}
                    />

                    <span>{item.name}</span>

                    {item.name === "Requests" && (
                      <span
                        style={{
                          marginLeft: "auto",
                          width: "17px",
                          height: "17px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#8e2734",
                          color: "#ffffff",
                          fontSize: "9px",
                          fontWeight: 900,
                        }}
                      >
                        !
                      </span>
                    )}
                  </Link>
                );
              })}

              <Link
                href="/admin/settings"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                style={{
                  minHeight: "48px",
                  padding: "0 13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  borderRadius: "9px",
                  color: pathname.startsWith(
                    "/admin/settings"
                  )
                    ? "#ffffff"
                    : "#b9c4d1",
                  background:
                    pathname.startsWith(
                      "/admin/settings"
                    )
                      ? "rgba(199,164,67,0.14)"
                      : "rgba(255,255,255,0.025)",
                  textDecoration: "none",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                <Icon
                  name="settings"
                  size={17}
                />

                <span>Settings</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      <style jsx>{`
        @media (max-width: 1150px) {
          header nav {
            gap: 1px !important;
          }

          header nav a {
            padding-left: 9px !important;
            padding-right: 9px !important;
          }

          header nav a span:last-child {
            font-size: 11px !important;
          }

          header > div {
            padding-left: 18px !important;
            padding-right: 18px !important;
          }
        }

        @media (max-width: 950px) {
          header nav {
            display: none !important;
          }

          header button {
            display: flex !important;
          }

          header > div {
            gap: 14px !important;
          }

          header > div > div:nth-child(3) {
            margin-left: auto;
          }

          header > div > div:nth-child(3) > div:nth-child(4) {
            display: none !important;
          }
        }

        @media (max-width: 600px) {
          header > div {
            min-height: 68px !important;
            padding-left: 14px !important;
            padding-right: 14px !important;
          }

          header a div:last-child {
            display: none;
          }

          header a:first-child > div:first-child {
            width: 40px !important;
            height: 40px !important;
          }

          header > div > div:nth-child(3) > a {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}