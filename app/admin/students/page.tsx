"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type Student = {
  id: number;
  userId: number;
  hallTicket: string;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  userStatus: string;

  branch: {
    id: number;
    name: string;
    code: string;
  };

  studyYear: {
    id: number;
    name: string;
    number: number;
  };
};

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

export default function StudentsPage() {
  const [students, setStudents] =
    useState<Student[]>([]);

  const [branches, setBranches] =
    useState<Branch[]>([]);

  const [studyYears, setStudyYears] =
    useState<StudyYear[]>([]);

  const [branchId, setBranchId] =
    useState<number | null>(null);

  const [studyYearId, setStudyYearId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [formLoading, setFormLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [editingStudentId, setEditingStudentId] =
    useState<number | null>(null);

  const [search, setSearch] =
    useState("");

  const [activeFilter, setActiveFilter] =
    useState("ALL");

  const [accountFilter, setAccountFilter] =
    useState("ALL");

  const [deletingStudent, setDeletingStudent] =
    useState<Student | null>(null);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

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

  const [isActive, setIsActive] =
    useState(true);

  /*
   * --------------------------------------------------
   * LOAD STUDENTS
   * --------------------------------------------------
   */

  async function loadStudents() {
    try {
      const response =
        await fetch(
          "/api/admin/students",
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
            "Unable to load students."
        );
      }

      const studentList: Student[] =
        result.data;

      setStudents(studentList);

      return studentList;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load students."
      );

      return [];
    }
  }

  /*
   * --------------------------------------------------
   * LOAD BRANCHES
   * --------------------------------------------------
   */

  async function loadBranches() {
    try {
      const response =
        await fetch(
          "/api/admin/branches",
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
            "Unable to load branches."
        );
      }

      const branchList: Branch[] =
        result.data;

      setBranches(
        branchList
      );

      /*
       * Select AI & ML by default when
       * it exists.
       */
      const aiMlBranch =
        branchList.find(
          (branch) =>
            branch.code === "AIML"
        );

      if (aiMlBranch) {
        setBranchId(
          aiMlBranch.id
        );
      } else if (
        branchList.length > 0
      ) {
        setBranchId(
          branchList[0].id
        );
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load branches."
      );
    }
  }

  /*
   * --------------------------------------------------
   * LOAD STUDY YEARS
   * --------------------------------------------------
   */

  async function loadStudyYears() {
    try {
      const response =
        await fetch(
          "/api/admin/study-years",
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
            "Unable to load study years."
        );
      }

      const studyYearList: StudyYear[] =
        result.data;

      setStudyYears(
        studyYearList
      );

      /*
       * Default to First Year.
       */
      const firstYear =
        studyYearList.find(
          (studyYear) =>
            studyYear.number === 1
        );

      if (firstYear) {
        setStudyYearId(
          String(firstYear.id)
        );
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load study years."
      );
    }
  }

  /*
   * --------------------------------------------------
   * LOAD ALL DATA
   * --------------------------------------------------
   */

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        loadStudents(),
        loadBranches(),
        loadStudyYears(),
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /*
   * --------------------------------------------------
   * RESET FORM
   * --------------------------------------------------
   */

  function resetForm() {
    setEditingStudentId(null);

    setName("");
    setHallTicket("");
    setEmail("");
    setPhone("");
    setPassword("");

    /*
     * Reset to First Year when available.
     */
    const firstYear =
      studyYears.find(
        (studyYear) =>
          studyYear.number === 1
      );

    setStudyYearId(
      firstYear
        ? String(firstYear.id)
        : ""
    );

    setIsActive(true);

    setError("");
    setMessage("");
  }

  /*
   * --------------------------------------------------
   * START EDITING
   * --------------------------------------------------
   */

  function startEditing(
    student: Student
  ) {
    setEditingStudentId(student.id);

    setName(student.name);
    setHallTicket(student.hallTicket);
    setEmail(student.email || "");
    setPhone(student.phone || "");
    setPassword("");

    setStudyYearId(
      String(student.studyYear.id)
    );

    setIsActive(student.isActive);
    setBranchId(student.branch.id);

    setError("");
    setMessage("");

    /*
     * The edit form is above the student table.
     * Scroll to it immediately so the user can
     * clearly see that Edit was activated.
     */
    window.requestAnimationFrame(() => {
      document
        .getElementById("student-form")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    });
  }

  /*
   * --------------------------------------------------
   * SUBMIT FORM
   * --------------------------------------------------
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFormLoading(true);
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
          "Please select a study year."
        );

        return;
      }

      if (
        !name.trim() ||
        !hallTicket.trim()
      ) {
        setError(
          "Student name and hall ticket are required."
        );

        return;
      }

      /*
       * --------------------------------------------------
       * EDIT STUDENT
       * --------------------------------------------------
       */

      if (
        editingStudentId !== null
      ) {
        const response =
          await fetch(
            `/api/admin/students/${editingStudentId}`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                name:
                  name.trim(),

                email:
                  email.trim(),

                phone:
                  phone.trim(),

                branchId,

                studyYearId:
                  Number(
                    studyYearId
                  ),

                isActive,
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
              "Unable to update student."
          );

          return;
        }

        setMessage(
          result.message ||
            "Student updated successfully."
        );

        resetForm();

        await loadStudents();

        return;
      }

      /*
       * --------------------------------------------------
       * ADD STUDENT
       * --------------------------------------------------
       */

      if (!password.trim()) {
        setError(
          "Initial password is required."
        );

        return;
      }

      if (
        password.length < 8
      ) {
        setError(
          "Password must contain at least 8 characters."
        );

        return;
      }

      const response =
        await fetch(
          "/api/admin/students",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name:
                name.trim(),

              hallTicket:
                hallTicket
                  .trim()
                  .toUpperCase(),

              email:
                email.trim(),

              phone:
                phone.trim(),

              password,

              branchId,

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
            "Unable to add student."
        );

        return;
      }

      setMessage(
        result.message ||
          "Student added successfully."
      );

      resetForm();

      await loadStudents();
    } catch (error) {
      console.error(
        "Student form error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setFormLoading(false);
    }
  }

  /*
   * --------------------------------------------------
   * DELETE STUDENT
   * --------------------------------------------------
   */

  function openDeleteConfirmation(student: Student) {
    setError("");
    setMessage("");
    setDeletingStudent(student);
  }

  function closeDeleteConfirmation() {
    if (deleteLoading) {
      return;
    }

    setDeletingStudent(null);
  }

  async function handleDeleteStudent() {
    if (!deletingStudent) {
      return;
    }

    try {
      setDeleteLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/admin/students/${deletingStudent.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.message ||
            "Unable to delete student."
        );
        return;
      }

      if (
        editingStudentId === deletingStudent.id
      ) {
        resetForm();
      }

      setDeletingStudent(null);

      setMessage(
        result.message ||
          "Student deleted successfully."
      );

      await loadStudents();
    } catch (error) {
      console.error(
        "Delete student error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  /*
   * --------------------------------------------------
   * FILTER STUDENTS
   * --------------------------------------------------
   */

  const filteredStudents =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return students.filter(
        (student) => {
          const matchesSearch =
            normalizedSearch ===
              "" ||
            student.name
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            student.hallTicket
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            (
              student.email ||
              ""
            )
              .toLowerCase()
              .includes(
                normalizedSearch
              );

          const matchesActive =
            activeFilter ===
              "ALL" ||
            (
              activeFilter ===
                "ACTIVE" &&
              student.isActive
            ) ||
            (
              activeFilter ===
                "INACTIVE" &&
              !student.isActive
            );

          const matchesAccount =
            accountFilter ===
              "ALL" ||
            student.userStatus ===
              accountFilter;

          return (
            matchesSearch &&
            matchesActive &&
            matchesAccount
          );
        }
      );
    }, [
      students,
      search,
      activeFilter,
      accountFilter,
    ]);

  return (
    <main>
      <h1>
        Student Management
      </h1>

      <p>
        Manage college students.
      </p>

      {message && (
        <p>{message}</p>
      )}

      {error && (
        <p>{error}</p>
      )}

      {/* =========================
          STUDENT FORM
      ========================== */}

      <section>
        <h2>
          {editingStudentId !==
          null
            ? "Edit Student"
            : "Add Student"}
        </h2>

        <form
          id="student-form"
          noValidate
          onSubmit={handleSubmit}
        >
          {/* STUDENT NAME */}

          <div>
            <label htmlFor="name">
              Student Name
            </label>

            <input
              id="name"
              type="text"
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
              Hall Ticket
            </label>

            <input
              id="hallTicket"
              type="text"
              value={
                hallTicket
              }
              readOnly={
                editingStudentId !==
                null
              }
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
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
            />
          </div>

          {/* PHONE */}

          <div>
            <label htmlFor="phone">
              Phone
            </label>

            <input
              id="phone"
              type="text"
              value={phone}
              onChange={(event) =>
                setPhone(
                  event.target.value
                )
              }
            />
          </div>

          {/* PASSWORD - ONLY ADD */}

          {editingStudentId ===
            null && (
            <div>
              <label htmlFor="password">
                Initial Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target
                      .value
                  )
                }
                minLength={8}
                required
              />

              <p>
                Minimum 8 characters.
              </p>
            </div>
          )}

          {/* BRANCH */}

          <div>
            <label htmlFor="branch">
              Branch
            </label>

            <select
              id="branch"
              value={
                branchId ?? ""
              }
              onChange={(event) =>
                setBranchId(
                  event.target.value
                    ? Number(
                        event.target
                          .value
                      )
                    : null
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
                    key={
                      branch.id
                    }
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
              Study Year
            </label>

            <select
              id="studyYear"
              value={
                studyYearId
              }
              onChange={(event) =>
                setStudyYearId(
                  event.target.value
                )
              }
              required
            >
              <option value="">
                Select Study Year
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

          {/* ACTIVE STATUS */}

          {editingStudentId !==
            null && (
            <div>
              <label htmlFor="isActive">
                Student Status
              </label>

              <select
                id="isActive"
                value={
                  isActive
                    ? "active"
                    : "inactive"
                }
                onChange={(event) =>
                  setIsActive(
                    event.target
                      .value ===
                      "active"
                  )
                }
              >
                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>
            </div>
          )}

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={
              formLoading
            }
          >
            {formLoading
              ? "Saving..."
              : editingStudentId !==
                  null
                ? "Update Student"
                : "Add Student"}
          </button>

          {/* CANCEL */}

          {editingStudentId !==
            null && (
            <button
              type="button"
              onClick={
                resetForm
              }
              disabled={
                formLoading
              }
            >
              Cancel Edit
            </button>
          )}
        </form>
      </section>

      {/* =========================
          STUDENT LIST
      ========================== */}

      <section>
        <h2>
          Students
        </h2>

        {/* SEARCH */}

        <div>
          <label htmlFor="search">
            Search Students
          </label>

          <input
            id="search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target
                  .value
              )
            }
            placeholder="Search by name, hall ticket or email"
          />
        </div>

        {/* ACTIVE FILTER */}

        <div>
          <label htmlFor="activeFilter">
            Student Status
          </label>

          <select
            id="activeFilter"
            value={
              activeFilter
            }
            onChange={(event) =>
              setActiveFilter(
                event.target
                  .value
              )
            }
          >
            <option value="ALL">
              All Students
            </option>

            <option value="ACTIVE">
              Active Only
            </option>

            <option value="INACTIVE">
              Inactive Only
            </option>
          </select>
        </div>

        {/* ACCOUNT FILTER */}

        <div>
          <label htmlFor="accountFilter">
            Account Status
          </label>

          <select
            id="accountFilter"
            value={
              accountFilter
            }
            onChange={(event) =>
              setAccountFilter(
                event.target
                  .value
              )
            }
          >
            <option value="ALL">
              All Accounts
            </option>

            <option value="APPROVED">
              Approved
            </option>

            <option value="PENDING">
              Pending
            </option>

            <option value="REJECTED">
              Rejected
            </option>
          </select>
        </div>

        <p>
          Showing{" "}
          {
            filteredStudents.length
          }{" "}
          of{" "}
          {students.length}{" "}
          students
        </p>

        {loading ? (
          <p>
            Loading students...
          </p>
        ) : filteredStudents.length ===
          0 ? (
          <p>
            No students match your
            search or filters.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>
                  Hall Ticket
                </th>

                <th>
                  Name
                </th>

                <th>
                  Email
                </th>

                <th>
                  Branch
                </th>

                <th>
                  Study Year
                </th>

                <th>
                  Status
                </th>

                <th>
                  Account
                </th>

                <th>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.map(
                (student) => (
                  <tr
                    key={
                      student.id
                    }
                  >
                    <td>
                      {
                        student.hallTicket
                      }
                    </td>

                    <td>
                      {
                        student.name
                      }
                    </td>

                    <td>
                      {
                        student.email ||
                        "N/A"
                      }
                    </td>

                    <td>
                      {
                        student.branch
                          .name
                      }
                    </td>

                    <td>
                      {
                        student
                          .studyYear
                          .name
                      }
                    </td>

                    <td>
                      {student.isActive
                        ? "Active"
                        : "Inactive"}
                    </td>

                    <td>
                      {
                        student.userStatus
                      }
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          startEditing(student);
                        }}
                      >
                        Edit
                      </button>

                      {" "}

                      <Link
                        href={`/admin/students/${student.id}`}
                      >
                        View
                      </Link>

                      {" "}

                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          openDeleteConfirmation(student);
                        }}
                        disabled={deleteLoading}
                        style={{
                          color: "#9f1239",
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </section>

      {/* =========================
          DELETE CONFIRMATION
      ========================== */}

      {deletingStudent && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deleteLoading
            ) {
              closeDeleteConfirmation();
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(15, 23, 42, 0.55)",
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-student-title"
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
            style={{
              width: "100%",
              maxWidth: "480px",
              background: "#ffffff",
              borderRadius: "14px",
              padding: "28px",
              boxShadow:
                "0 20px 60px rgba(15, 23, 42, 0.25)",
              border:
                "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#fff1f2",
                color: "#be123c",
                fontSize: "24px",
                fontWeight: 700,
                marginBottom: "16px",
              }}
            >
              !
            </div>

            <h2
              id="delete-student-title"
              style={{
                marginBottom: "8px",
                color: "#172033",
              }}
            >
              Delete Student?
            </h2>

            <p
              style={{
                marginBottom: "8px",
                color: "#475569",
              }}
            >
              You are about to permanently delete:
            </p>

            <div
              style={{
                padding: "14px 16px",
                marginBottom: "18px",
                borderRadius: "10px",
                background: "#f8fafc",
                border:
                  "1px solid #e2e8f0",
              }}
            >
              <strong
                style={{
                  display: "block",
                  color: "#172033",
                  marginBottom: "3px",
                }}
              >
                {deletingStudent.name}
              </strong>

              <span
                style={{
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                {deletingStudent.hallTicket} •{" "}
                {deletingStudent.branch.name} •{" "}
                {deletingStudent.studyYear.name}
              </span>
            </div>

            <p
              style={{
                marginBottom: "22px",
                color: "#9f1239",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              This will permanently remove the
              student account and their attendance
              records. This action cannot be undone.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={closeDeleteConfirmation}
                disabled={deleteLoading}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  background: "#f1f5f9",
                  color: "#334155",
                  cursor: deleteLoading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteStudent}
                disabled={deleteLoading}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  background: "#9f1239",
                  color: "#ffffff",
                  cursor: deleteLoading
                    ? "not-allowed"
                    : "pointer",
                  fontWeight: 600,
                  opacity: deleteLoading
                    ? 0.7
                    : 1,
                }}
              >
                {deleteLoading
                  ? "Deleting..."
                  : "Yes, Delete Student"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}