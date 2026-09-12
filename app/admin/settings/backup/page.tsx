"use client";

import { useRef, useState } from "react";
import Link from "next/link";

export default function BackupRestorePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleBackup() {
    try {
      setBackupLoading(true);
      setMessage("");
      setError("");

      const response = await fetch(
        "/api/admin/settings/backup",
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        let errorMessage =
          "Unable to create database backup.";

        try {
          const result = await response.json();
          errorMessage =
            result.message || errorMessage;
        } catch {
          // Response was not JSON.
        }

        throw new Error(errorMessage);
      }

      const blob = await response.blob();

      const contentDisposition =
        response.headers.get(
          "Content-Disposition"
        );

      let fileName = "attendance-backup.db";

      const fileNameMatch =
        contentDisposition?.match(
          /filename="?([^"]+)"?/i
        );

      if (fileNameMatch?.[1]) {
        fileName = fileNameMatch[1];
      }

      const url = window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage(
        "Database backup downloaded successfully."
      );
    } catch (error) {
      console.error(
        "Database backup error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to create database backup."
      );
    } finally {
      setBackupLoading(false);
    }
  }

  async function handleRestore() {
    const file =
      fileInputRef.current?.files?.[0];

    if (!file) {
      setError(
        "Please select a SQLite backup file first."
      );
      return;
    }

    const confirmed = window.confirm(
      "WARNING: Restoring a database backup will replace the current database data. Any changes made after this backup was created may be lost.\n\nAre you sure you want to continue?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setRestoreLoading(true);
      setMessage("");
      setError("");

      const formData = new FormData();

      formData.append("backup", file);

      const response = await fetch(
        "/api/admin/settings/backup",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to restore database."
        );
      }

      setMessage(
        result.message ||
          "Database restored successfully."
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error(
        "Database restore error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to restore database."
      );
    } finally {
      setRestoreLoading(false);
    }
  }

  return (
    <main>
      <div>
        <Link href="/admin/settings">
          ← Back to Settings
        </Link>
      </div>

      <h1>Backup & Restore</h1>

      <p>
        Manage backups of the College Attendance
        Management System database.
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

      <section>
        <h2>Database Backup</h2>

        <p>
          Download a complete copy of the current
          SQLite database.
        </p>

        <button
          type="button"
          onClick={handleBackup}
          disabled={
            backupLoading || restoreLoading
          }
        >
          {backupLoading
            ? "Creating Backup..."
            : "Download Database Backup"}
        </button>
      </section>

      <section>
        <h2>Restore Database</h2>

        <p>
          Select a previously downloaded SQLite
          database backup to restore the system.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".db,.sqlite,.sqlite3"
          disabled={
            backupLoading || restoreLoading
          }
        />

        <br />
        <br />

        <button
          type="button"
          onClick={handleRestore}
          disabled={
            backupLoading || restoreLoading
          }
        >
          {restoreLoading
            ? "Restoring Database..."
            : "Restore Database"}
        </button>
      </section>

      <section>
        <h2>Important</h2>

        <ul>
          <li>
            Always create a backup before making
            major database changes.
          </li>

          <li>
            Restoring a backup can replace newer
            data with older data.
          </li>

          <li>
            Only SQLite database backup files
            should be uploaded.
          </li>

          <li>
            Keep downloaded backups in a secure
            location.
          </li>
        </ul>
      </section>
    </main>
  );
}