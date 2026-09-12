import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { NextResponse } from "next/server";

const createStudentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name is required"),

  hallTicket: z
    .string()
    .trim()
    .min(3, "Hall ticket is required")
    .max(50, "Hall ticket is too long"),

  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),

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

  branchId: z
    .number()
    .int()
    .positive("Invalid branch"),

  studyYearId: z
    .number()
    .int()
    .positive("Invalid study year"),
});

export async function GET() {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const students =
      await db.student.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true,
              status: true,
            },
          },

          branch: true,

          studyYear: true,
        },

        orderBy: {
          name: "asc",
        },
      });

    return NextResponse.json({
      success: true,

      data: students.map(
        (student) => ({
          id: student.id,
          userId: student.userId,

          hallTicket:
            student.hallTicket,

          name: student.name,

          email:
            student.email,

          phone:
            student.phone,

          isActive:
            student.isActive,

          userStatus:
            student.user.status,

          branch: {
            id:
              student.branch.id,

            name:
              student.branch.name,

            code:
              student.branch.code,
          },

          studyYear: {
            id:
              student.studyYear.id,

            name:
              student.studyYear.name,

            number:
              student.studyYear.number,
          },

          createdAt:
            student.createdAt,

          updatedAt:
            student.updatedAt,
        })
      ),
    });
  } catch (error) {
    console.error(
      "Student list error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load students.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const body =
      await request.json();

    const result =
      createStudentSchema.safeParse(
        body
      );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid student data.",
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
      email,
      phone,
      password,
      branchId,
      studyYearId,
    } = result.data;

    const normalizedHallTicket =
      hallTicket.toUpperCase();

    /*
     * Check duplicate student.
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
     * Check duplicate user account.
     */
    const existingUser =
      await db.user.findUnique({
        where: {
          username:
            normalizedHallTicket,
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
     * Validate branch.
     */
    const branch =
      await db.branch.findUnique({
        where: {
          id: branchId,
        },
      });

    if (
      !branch ||
      !branch.isActive
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected branch is not available.",
        },
        { status: 400 }
      );
    }

    /*
     * Validate study year.
     */
    const studyYear =
      await db.studyYear.findUnique({
        where: {
          id: studyYearId,
        },
      });

    if (
      !studyYear ||
      !studyYear.isActive
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected study year is not available.",
        },
        { status: 400 }
      );
    }

    /*
     * Hash password before storing it.
     */
    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );

    /*
     * Create the approved student account.
     *
     * Students added directly by the Admin
     * are immediately approved.
     */
    const user =
      await db.user.create({
        data: {
          username:
            normalizedHallTicket,

          passwordHash,

          role: "STUDENT",

          status: "APPROVED",

          student: {
            create: {
              hallTicket:
                normalizedHallTicket,

              name,

              email:
                email || null,

              phone:
                phone || null,

              branchId,

              studyYearId,

              isActive: true,
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
          "Student added successfully.",

        data: {
          userId:
            user.id,

          username:
            user.username,

          status:
            user.status,

          studentId:
            user.student?.id ??
            null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Add student error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to add student.",
      },
      { status: 500 }
    );
  }
}