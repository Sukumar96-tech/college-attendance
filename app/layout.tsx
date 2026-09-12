import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "College Attendance Management System",
    template:
      "%s | College Attendance Management System",
  },
  description:
    "A secure and modern attendance management system for HODs and students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}