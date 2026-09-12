"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  name: string;
  href: string;
  icon: "dashboard" | "attendance" | "profile";
};

const navigationItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/student/dashboard",
    icon: "dashboard",
  },
  {
    name: "My Attendance",
    href: "/student/attendance",
    icon: "attendance",
  },
  {
    name: "My Profile",
    href: "/student/profile",
    icon: "profile",
  },
];

function isActivePath(
  pathname: string,
  href: string
) {
  if (href === "/student/dashboard") {
    return pathname === href;
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

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

function NavigationIcon({
  name,
  size = 17,
}: {
  name: NavItem["icon"];
  size?: number;
}) {
  if (name === "dashboard") {
    return <DashboardIcon size={size} />;
  }

  if (name === "attendance") {
    return <AttendanceIcon size={size} />;
  }

  return <ProfileIcon size={size} />;
}

function LogoutIcon({
  size = 16,
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
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 3v18" />
    </svg>
  );
}

function getInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "S";
  }

  if (words.length === 1) {
    return words[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    words[0].charAt(0) +
    words[words.length - 1].charAt(0)
  ).toUpperCase();
}

export default function StudentNavbar() {
  const pathname = usePathname();

  return (
    <>
      <header className="student-navbar-wrapper">
        <div className="student-navbar">
          {/* BRAND */}

          <Link
            href="/student/dashboard"
            className="student-brand"
          >
            <div className="student-brand-logo">
              CA
            </div>

            <div className="student-brand-text">
              <div className="student-brand-title">
                COLLEGE
              </div>

              <div className="student-brand-subtitle">
                Attendance ERP
              </div>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION */}

          <nav className="student-navigation">
            {navigationItems.map(
              (item) => {
                const active =
                  isActivePath(
                    pathname,
                    item.href
                  );

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`student-navigation-link ${
                      active
                        ? "active"
                        : ""
                    }`}
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                  >
                    <span className="student-navigation-icon">
                      <NavigationIcon
                        name={item.icon}
                      />
                    </span>

                    <span>
                      {item.name}
                    </span>
                  </Link>
                );
              }
            )}
          </nav>

          {/* STUDENT AREA */}

          <div className="student-navbar-right">
            <div className="student-profile-summary">
              <div className="student-profile-avatar">
                S
              </div>

              <div className="student-profile-text">
                <strong>
                  Student Portal
                </strong>

                <span>
                  Academic Account
                </span>
              </div>
            </div>

            <div className="student-navbar-divider" />

            <Link
              href="/login"
              className="student-logout-link"
            >
              <LogoutIcon />

              <span>Logout</span>
            </Link>
          </div>
        </div>

        {/* MOBILE NAVIGATION */}

        <nav className="student-mobile-navigation">
          {navigationItems.map(
            (item) => {
              const active =
                isActivePath(
                  pathname,
                  item.href
                );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`student-mobile-link ${
                    active
                      ? "active"
                      : ""
                  }`}
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                >
                  <NavigationIcon
                    name={item.icon}
                    size={16}
                  />

                  <span>
                    {item.name ===
                    "My Attendance"
                      ? "Attendance"
                      : item.name ===
                          "My Profile"
                        ? "Profile"
                        : "Dashboard"}
                  </span>
                </Link>
              );
            }
          )}
        </nav>
      </header>

      <style>{`
        .student-navbar-wrapper {
          position: sticky;
          top: 0;
          z-index: 1000;
          width: 100%;
          background: #172334;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 30px rgba(15,23,42,0.12);
        }

        .student-navbar {
          min-height: 76px;
          width: 100%;
          padding: 0 30px;
          display: flex;
          align-items: center;
          gap: 25px;
        }

        .student-brand {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #ffffff;
          text-decoration: none;
        }

        .student-brand-logo {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 11px;
          background: #c7a443;
          color: #172334;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.03em;
          box-shadow: 0 5px 18px rgba(199,164,67,0.20);
        }

        .student-brand-title {
          color: #ffffff;
          font-size: 14px;
          line-height: 1.1;
          font-weight: 900;
          letter-spacing: 0.13em;
        }

        .student-brand-subtitle {
          margin-top: 4px;
          color: #aeb9c7;
          font-size: 11px;
          font-weight: 500;
        }

        .student-navigation {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .student-navigation-link {
          position: relative;
          min-height: 44px;
          padding: 0 14px;
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

        .student-navigation-link:hover {
          color: #ffffff;
          background: rgba(255,255,255,0.06);
        }

        .student-navigation-link.active {
          color: #ffffff;
          background: rgba(199,164,67,0.14);
        }

        .student-navigation-link.active::after {
          content: "";
          position: absolute;
          left: 13px;
          right: 13px;
          bottom: 0;
          height: 2px;
          border-radius: 3px 3px 0 0;
          background: #c7a443;
        }

        .student-navigation-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8996a6;
        }

        .student-navigation-link.active
          .student-navigation-icon {
          color: #c7a443;
        }

        .student-navbar-right {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .student-profile-summary {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .student-profile-avatar {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #c7a443;
          color: #172334;
          font-size: 13px;
          font-weight: 900;
        }

        .student-profile-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .student-profile-text strong {
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .student-profile-text span {
          color: #8996a6;
          font-size: 9px;
          font-weight: 500;
          white-space: nowrap;
        }

        .student-navbar-divider {
          width: 1px;
          height: 30px;
          background: rgba(255,255,255,0.10);
        }

        .student-logout-link {
          min-height: 38px;
          padding: 0 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border-radius: 8px;
          color: #b7c1ce;
          background: rgba(255,255,255,0.045);
          text-decoration: none;
          font-size: 10px;
          font-weight: 700;
          transition:
            background 160ms ease,
            color 160ms ease;
        }

        .student-logout-link:hover {
          background: rgba(142,39,52,0.18);
          color: #ffffff;
        }

        .student-mobile-navigation {
          display: none;
        }

        @media (max-width: 1100px) {
          .student-navbar {
            padding-left: 20px;
            padding-right: 20px;
            gap: 15px;
          }

          .student-navigation {
            gap: 2px;
          }

          .student-navigation-link {
            padding-left: 9px;
            padding-right: 9px;
          }

          .student-profile-text {
            display: none;
          }
        }

        @media (max-width: 850px) {
          .student-navigation {
            display: none;
          }

          .student-navbar {
            min-height: 68px;
          }

          .student-navbar-right {
            margin-left: auto;
          }

          .student-mobile-navigation {
            padding: 8px 14px 11px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 5px;
            border-top: 1px solid rgba(255,255,255,0.07);
            background: #14202f;
          }

          .student-mobile-link {
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

          .student-mobile-link.active {
            color: #ffffff;
            background: rgba(199,164,67,0.14);
          }

          .student-mobile-link.active svg {
            color: #c7a443;
          }
        }

        @media (max-width: 600px) {
          .student-navbar {
            min-height: 64px;
            padding-left: 14px;
            padding-right: 14px;
          }

          .student-brand-text {
            display: none;
          }

          .student-brand-logo {
            width: 40px;
            height: 40px;
          }

          .student-profile-summary {
            display: none;
          }

          .student-navbar-divider {
            display: none;
          }

          .student-logout-link {
            padding-left: 10px;
            padding-right: 10px;
          }
        }

        @media (max-width: 420px) {
          .student-mobile-link span {
            font-size: 9px;
          }

          .student-mobile-navigation {
            padding-left: 9px;
            padding-right: 9px;
          }
        }
      `}</style>
    </>
  );
}