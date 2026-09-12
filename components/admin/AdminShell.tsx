"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f6f9",
      }}
    >
      <AdminSidebar
        open={open}
        onToggle={() => setOpen(!open)}
      />

      <main
        style={{
          minHeight: "100vh",
          marginLeft: open ? "270px" : "78px",
          transition: "margin-left 0.2s ease",
        }}
      >
        {children}
      </main>
    </div>
  );
}