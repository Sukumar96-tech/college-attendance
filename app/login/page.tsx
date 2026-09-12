"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.message || "Login failed."
        );
        return;
      }

      if (result.data.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (
        result.data.role === "STUDENT"
      ) {
        router.push("/student/dashboard");
      } else {
        setError("Unknown user role.");
      }

      router.refresh();
    } catch {
      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Login</h1>

      <p>
        College Attendance Management System
      </p>

      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="username">
            Username / Hall Ticket
          </label>

          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) =>
              setUsername(event.target.value)
            }
            placeholder="Enter username or hall ticket"
            required
          />
        </div>

        <div>
          <label htmlFor="password">
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Enter password"
            required
          />
        </div>

        {error && <p>{error}</p>}

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Logging in..."
            : "Login"}
        </button>
      </form>

      <p>
        <Link href="/forgot-password">
          Forgot Password? (Students)
        </Link>
      </p>

      <p>
        New student?{" "}
        <Link href="/register">
          Register here
        </Link>
      </p>
    </main>
  );
}