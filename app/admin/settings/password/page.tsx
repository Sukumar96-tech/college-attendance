"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function AdminPasswordPage() {
  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError(
        "New passwords do not match."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "/api/admin/settings/password",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
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
            "Unable to change password."
        );
      }

      setMessage(
        "Password changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(
        "Password page error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to change password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Change Password</h1>

      <p>
        Change the password for your
        administrator account.
      </p>

      {message && (
        <section>
          <p>{message}</p>
        </section>
      )}

      {error && (
        <section>
          <p>{error}</p>
        </section>
      )}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="currentPassword">
            Current Password
          </label>

          <br />

          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(event) =>
              setCurrentPassword(
                event.target.value
              )
            }
            autoComplete="current-password"
            required
          />
        </div>

        <br />

        <div>
          <label htmlFor="newPassword">
            New Password
          </label>

          <br />

          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(event) =>
              setNewPassword(
                event.target.value
              )
            }
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />
        </div>

        <br />

        <div>
          <label htmlFor="confirmPassword">
            Confirm New Password
          </label>

          <br />

          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(
                event.target.value
              )
            }
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />
        </div>

        <br />

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Changing Password..."
            : "Change Password"}
        </button>
      </form>

      <br />

      <Link href="/admin/settings">
        Back to Settings
      </Link>
    </main>
  );
}