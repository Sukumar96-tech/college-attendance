"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;

    try {
      setLoggingOut(true);

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to logout."
        );
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);

      setLoggingOut(false);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to logout. Please try again."
      );
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
    >
      {loggingOut ? "Logging out..." : "Logout"}
    </button>
  );
}