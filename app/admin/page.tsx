"use client";

import { useEffect, useState } from "react";

type Registration = {
  userId: number;
  username: string;
  status: string;
  createdAt: string;
  student: {
    id: number;
    hallTicket: string;
    name: string;
    email: string | null;
    branch: string;
    studyYear: string;
  } | null;
};

export default function AdminPage() {
  const [registrations, setRegistrations] =
    useState<Registration[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [processingId, setProcessingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  async function loadRegistrations() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/registrations",
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
            "Unable to load registrations."
        );

        return;
      }

      setRegistrations(
        result.data
      );
    } catch {
      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRegistrations();
  }, []);

  async function handleAction(
    userId: number,
    action: "APPROVE" | "REJECT"
  ) {
    try {
      setProcessingId(userId);
      setError("");
      setMessage("");

      const response =
        await fetch(
          `/api/admin/registrations/${userId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              action,
            }),
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
            "Unable to update registration."
        );

        return;
      }

      setMessage(
        result.message
      );

      setRegistrations(
        (current) =>
          current.filter(
            (registration) =>
              registration.userId !==
              userId
          )
      );
    } catch {
      setError(
        "Unable to connect to the server."
      );
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <main>
      <h1>
        HOD Admin Panel
      </h1>

      <p>
        Manage student registration
        requests from this page.
      </p>

      {message && (
        <p>
          {message}
        </p>
      )}

      {error && (
        <p>
          {error}
        </p>
      )}

      <section>
        <h2>
          Pending Registration Requests
        </h2>

        {loading && (
          <p>
            Loading registration
            requests...
          </p>
        )}

        {!loading &&
          registrations.length === 0 && (
            <p>
              No pending registration
              requests.
            </p>
          )}

        {!loading &&
          registrations.length > 0 && (
            <div>
              {registrations.map(
                (registration) => (
                  <article
                    key={
                      registration.userId
                    }
                  >
                    <h3>
                      {registration.student
                        ?.name ||
                        registration.username}
                    </h3>

                    <p>
                      Hall Ticket:{" "}
                      {registration.student
                        ?.hallTicket ||
                        "N/A"}
                    </p>

                    <p>
                      Email:{" "}
                      {registration.student
                        ?.email ||
                        "N/A"}
                    </p>

                    <p>
                      Branch:{" "}
                      {registration.student
                        ?.branch ||
                        "N/A"}
                    </p>

                    <p>
                      Study Year:{" "}
                      {registration.student
                        ?.studyYear ||
                        "N/A"}
                    </p>

                    <p>
                      Status:{" "}
                      {registration.status}
                    </p>

                    <button
                      type="button"
                      disabled={
                        processingId ===
                        registration.userId
                      }
                      onClick={() =>
                        handleAction(
                          registration.userId,
                          "APPROVE"
                        )
                      }
                    >
                      {processingId ===
                      registration.userId
                        ? "Processing..."
                        : "Approve"}
                    </button>

                    <button
                      type="button"
                      disabled={
                        processingId ===
                        registration.userId
                      }
                      onClick={() =>
                        handleAction(
                          registration.userId,
                          "REJECT"
                        )
                      }
                    >
                      Reject
                    </button>
                  </article>
                )
              )}
            </div>
          )}
      </section>
    </main>
  );
}