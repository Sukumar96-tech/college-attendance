"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Step = "VERIFY" | "RESET" | "SUCCESS";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("VERIFY");

  const [hallTicket, setHallTicket] = useState("");
  const [email, setEmail] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleVerify(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/auth/forgot-password/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            hallTicket: hallTicket.trim(),
            email: email.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.message ||
            "Unable to verify student details."
        );
        return;
      }

      setMessage(
        "Student details verified successfully."
      );

      setStep("RESET");
    } catch (error) {
      console.error(
        "Forgot password verification error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "New password and confirm password do not match."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "/api/auth/forgot-password/reset",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            hallTicket: hallTicket.trim(),
            email: email.trim(),
            newPassword,
            confirmPassword,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.message ||
            "Unable to reset password."
        );
        return;
      }

      setStep("SUCCESS");

      setMessage(
        "Your password has been reset successfully."
      );
    } catch (error) {
      console.error(
        "Password reset error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Forgot Password</h1>

      <p>
        Student Password Recovery
      </p>

      {step === "VERIFY" && (
        <section>
          <h2>Verify Student Account</h2>

          <p>
            Enter your hall ticket number and
            registered email address.
          </p>

          <form onSubmit={handleVerify}>
            <div>
              <label htmlFor="hallTicket">
                Hall Ticket Number
              </label>

              <br />

              <input
                id="hallTicket"
                type="text"
                value={hallTicket}
                onChange={(event) =>
                  setHallTicket(event.target.value)
                }
                placeholder="Enter hall ticket number"
                required
              />
            </div>

            <br />

            <div>
              <label htmlFor="email">
                Registered Email
              </label>

              <br />

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Enter registered email"
                required
              />
            </div>

            <br />

            {error && (
              <p>
                {error}
              </p>
            )}

            {message && (
              <p>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Verifying..."
                : "Verify Student"}
            </button>
          </form>
        </section>
      )}

      {step === "RESET" && (
        <section>
          <h2>Create New Password</h2>

          <p>
            Your student account has been
            verified.
          </p>

          <form onSubmit={handleReset}>
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
                placeholder="Enter new password"
                minLength={8}
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
                placeholder="Confirm new password"
                minLength={8}
                required
              />
            </div>

            <p>
              Password must contain at least
              8 characters.
            </p>

            {error && (
              <p>
                {error}
              </p>
            )}

            {message && (
              <p>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Updating Password..."
                : "Reset Password"}
            </button>
          </form>
        </section>
      )}

      {step === "SUCCESS" && (
        <section>
          <h2>Password Reset Successful</h2>

          <p>
            Your password has been updated
            successfully.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/login")
            }
          >
            Go to Login
          </button>
        </section>
      )}

      <br />

      <p>
        <Link href="/login">
          ← Back to Login
        </Link>
      </p>
    </main>
  );
}