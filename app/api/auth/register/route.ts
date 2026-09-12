import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { NextResponse } from "next/server";

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name is required")
      .max(100, "Name is too long"),

    hallTicket: z
      .string()
      .trim()
      .min(3, "Hall ticket is required")
      .max(50, "Hall ticket is too long"),

    branchId: z
      .number()
      .int()
      .positive("Invalid branch"),

    studyYearId: z
      .number()
      .int()
      .positive("Invalid study year"),

    email: z
      .string()
      .trim()
      .email("Invalid email address"),

    phone: z
      .string()
      .trim()
      .max(20, "Phone number is too long")
      .optional()
      .or(z.literal("")),

    password: z
      .string()
      .min(
        8,
        "Password must be at least 8 characters"
      ),

    confirmPassword: z.string(),
  })
  .refine(
    (data) =>
      data.password ===
      data.confirmPassword,
    {
      message:
        "Passwords do not match",
      path: [
        "confirmPassword",
      ],
    }
  );

export async function POST(
  request: Request
) {
  try {
    let body: unknown;

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid JSON request body.",
        },
        { status: 400 }
      );
    }

    const result =
      registerSchema.safeParse(
        body
      );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid registration data.",
          errors:
            result.error.flatten()
              .fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      name,
      hallTicket,
      branchId,
      studyYearId,
      email,
      phone,
      password,
    } = result.data;

    const normalizedHallTicket =
      hallTicket.toUpperCase();

    /*
     * -----------------------------------------------
     * CHECK HALL TICKET
     * -----------------------------------------------
     */

    const existingStudent =
      await db.student.findUnique({
        where: {
          hallTicket:
            normalizedHallTicket,
        },
      });

    if (existingStudent) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A student with this hall ticket already exists.",
        },
        { status: 409 }
      );
    }

    /*
     * -----------------------------------------------
     * USERNAME
     * -----------------------------------------------
     *
     * Hall ticket is used as the student username.
     */

    const username =
      normalizedHallTicket;

    const existingUser =
      await db.user.findUnique({
        where: {
          username,
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "An account with this hall ticket already exists.",
        },
        { status: 409 }
      );
    }

    /*
     * -----------------------------------------------
     * VERIFY BRANCH
     * -----------------------------------------------
     */

    const branch =
      await db.branch.findUnique({
        where: {
          id: branchId,
        },
      });

    if (!branch) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected branch was not found.",
        },
        { status: 404 }
      );
    }

    if (!branch.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected branch is inactive.",
        },
        { status: 400 }
      );
    }

    /*
     * -----------------------------------------------
     * VERIFY STUDY YEAR
     * -----------------------------------------------
     */

    const studyYear =
      await db.studyYear.findUnique({
        where: {
          id: studyYearId,
        },
      });

    if (!studyYear) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected study year was not found.",
        },
        { status: 404 }
      );
    }

    if (!studyYear.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected study year is inactive.",
        },
        { status: 400 }
      );
    }

    /*
     * -----------------------------------------------
     * HASH PASSWORD
     * -----------------------------------------------
     */

    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );

    /*
     * -----------------------------------------------
     * CREATE USER + STUDENT
     * -----------------------------------------------
     *
     * Registration starts as PENDING.
     * HOD must approve the account.
     */

    const user =
      await db.user.create({
        data: {
          username,
          passwordHash,
          role: "STUDENT",
          status: "PENDING",

          student: {
            create: {
              hallTicket:
                normalizedHallTicket,

              name,

              branchId,

              studyYearId,

              email,

              phone:
                phone || null,
            },
          },
        },

        include: {
          student: true,
        },
      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Registration successful. Your account is pending HOD approval.",

        data: {
          userId:
            user.id,

          username:
            user.username,

          hallTicket:
            user.student
              ?.hallTicket,

          status:
            user.status,

          branch: {
            id: branch.id,
            name: branch.name,
            code: branch.code,
          },

          studyYear: {
            id:
              studyYear.id,

            name:
              studyYear.name,

            number:
              studyYear.number,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Student registration error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to complete registration.",
      },
      { status: 500 }
    );
  }
}