"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type Branch = {
  id: number;
  name: string;
  code: string;
};

type StudyYear = {
  id: number;
  name: string;
  number: number;
};

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] =
    useState("");

  const [hallTicket, setHallTicket] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [branchId, setBranchId] =
    useState("");

  const [studyYearId, setStudyYearId] =
    useState("");

  const [branches, setBranches] =
    useState<Branch[]>([]);

  const [studyYears, setStudyYears] =
    useState<StudyYear[]>([]);

  const [loadingData, setLoadingData] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  /*
   * --------------------------------------------------
   * LOAD BRANCHES AND STUDY YEARS
   * --------------------------------------------------
   *
   * Registration is public, so the page must not use
   * admin-protected APIs.
   *
   * The public registration-options API provides
   * active branches and active study years.
   */

  useEffect(() => {
    async function loadRegistrationData() {
      try {
        setLoadingData(true);
        setError("");

        const response = await fetch(
          "/api/auth/registration-options",
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
          throw new Error(
            result.message ||
              "Unable to load registration options."
          );
        }

        setBranches(
          result.data.branches
        );

        setStudyYears(
          result.data.studyYears
        );
      } catch (error) {
        console.error(
          "Registration data error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load registration data."
        );
      } finally {
        setLoadingData(false);
      }
    }

    loadRegistrationData();
  }, []);

  /*
   * --------------------------------------------------
   * REGISTER
   * --------------------------------------------------
   */

  async function handleRegister(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (!branchId) {
        setError(
          "Please select a branch."
        );

        return;
      }

      if (!studyYearId) {
        setError(
          "Please select your year."
        );

        return;
      }

      const response =
        await fetch(
          "/api/auth/register",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name,
              hallTicket,
              email,
              phone,
              password,
              confirmPassword,

              branchId:
                Number(branchId),

              studyYearId:
                Number(
                  studyYearId
                ),
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
            "Registration failed."
        );

        return;
      }

      setMessage(
        result.message ||
          "Registration successful. Waiting for HOD approval."
      );

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch {
      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * --------------------------------------------------
   * PAGE
   * --------------------------------------------------
   */

  return (
    <main>
      <h1>
        Student Registration
      </h1>

      <p>
        Create your student account.
      </p>

      {loadingData && (
        <p>
          Loading registration options...
        </p>
      )}

      {!loadingData && (
        <form
          onSubmit={
            handleRegister
          }
        >
          {/* NAME */}

          <div>
            <label htmlFor="name">
              Full Name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              required
            />
          </div>

          {/* HALL TICKET */}

          <div>
            <label htmlFor="hallTicket">
              Hall Ticket Number
            </label>

            <input
              id="hallTicket"
              name="hallTicket"
              type="text"
              placeholder="Enter hall ticket number"
              value={hallTicket}
              onChange={(event) =>
                setHallTicket(
                  event.target.value
                )
              }
              required
            />
          </div>

          {/* EMAIL */}

          <div>
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              required
            />
          </div>

          {/* PHONE */}

          <div>
            <label htmlFor="phone">
              Phone Number
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Enter phone number"
              value={phone}
              onChange={(event) =>
                setPhone(
                  event.target.value
                )
              }
            />
          </div>

          {/* BRANCH */}

          <div>
            <label htmlFor="branch">
              Branch
            </label>

            <select
              id="branch"
              value={branchId}
              onChange={(event) =>
                setBranchId(
                  event.target.value
                )
              }
              required
            >
              <option value="">
                Select Branch
              </option>

              {branches.map(
                (branch) => (
                  <option
                    key={branch.id}
                    value={
                      branch.id
                    }
                  >
                    {branch.name}
                  </option>
                )
              )}
            </select>
          </div>

          {/* STUDY YEAR */}

          <div>
            <label htmlFor="studyYear">
              Current Year
            </label>

            <select
              id="studyYear"
              value={studyYearId}
              onChange={(event) =>
                setStudyYearId(
                  event.target.value
                )
              }
              required
            >
              <option value="">
                Select Year
              </option>

              {studyYears.map(
                (studyYear) => (
                  <option
                    key={
                      studyYear.id
                    }
                    value={
                      studyYear.id
                    }
                  >
                    {
                      studyYear.name
                    }
                  </option>
                )
              )}
            </select>
          </div>

          {/* PASSWORD */}

          <div>
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Create password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              required
            />
          </div>

          {/* CONFIRM PASSWORD */}

          <div>
            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm password"
              value={
                confirmPassword
              }
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              required
            />
          </div>

          {/* ERROR */}

          {error && (
            <p>
              {error}
            </p>
          )}

          {/* SUCCESS */}

          {message && (
            <p>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              loadingData
            }
          >
            {loading
              ? "Registering..."
              : "Register"}
          </button>
        </form>
      )}

      <p>
        Already registered?{" "}
        <a href="/login">
          Login
        </a>
      </p>

      <p>
        Your account will remain
        pending until it is approved
        by the HOD.
      </p>
    </main>
  );
}