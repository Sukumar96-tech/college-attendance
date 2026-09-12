import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { z } from "zod";
import { NextResponse } from "next/server";

const updateStudentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name is required"),

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

  branchId: z
    .number()
    .int()
    .positive("Invalid branch"),

  studyYearId: z
    .number()
    .int()
    .positive("Invalid study year"),

  isActive: z.boolean(),
});

type RouteContext = {
  params: Promise<{
    studentId: string;
  }>;
};

function parseStudentId(studentId: string) {
  const parsedStudentId = Number(studentId);

  if (
    !Number.isInteger(parsedStudentId) ||
    parsedStudentId <= 0
  ) {
    return null;
  }

  return parsedStudentId;
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const { studentId } =
      await context.params;

    const parsedStudentId =
      parseStudentId(studentId);

    if (parsedStudentId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid student ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const result =
      updateStudentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid student data.",
          errors:
            result.error.flatten()
              .fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      phone,
      branchId,
      studyYearId,
      isActive,
    } = result.data;

    /*
     * Find the existing student.
     */
    const existingStudent =
      await db.student.findUnique({
        where: {
          id: parsedStudentId,
        },

        include: {
          user: true,
        },
      });

    if (!existingStudent) {
      return NextResponse.json(
        {
          success: false,
          message: "Student not found.",
        },
        { status: 404 }
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

    if (!branch || !branch.isActive) {
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
     * Update the student.
     */
    const updatedStudent =
      await db.student.update({
        where: {
          id: parsedStudentId,
        },

        data: {
          name,
          email: email || null,
          phone: phone || null,
          branchId,
          studyYearId,
          isActive,
        },

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
      });

    return NextResponse.json({
      success: true,

      message: isActive
        ? "Student updated and activated successfully."
        : "Student updated and deactivated successfully.",

      data: {
        id: updatedStudent.id,

        userId: updatedStudent.userId,

        hallTicket:
          updatedStudent.hallTicket,

        name: updatedStudent.name,

        email: updatedStudent.email,

        phone: updatedStudent.phone,

        isActive:
          updatedStudent.isActive,

        userStatus:
          updatedStudent.user.status,

        branch: {
          id:
            updatedStudent.branch.id,

          name:
            updatedStudent.branch.name,

          code:
            updatedStudent.branch.code,
        },

        studyYear: {
          id:
            updatedStudent.studyYear.id,

          name:
            updatedStudent.studyYear.name,

          number:
            updatedStudent.studyYear.number,
        },
      },
    });
  } catch (error) {
    console.error(
      "Update student error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update student.",
      },
      { status: 500 }
    );
  }
}

/*
 * DELETE STUDENT
 *
 * Permanently deletes:
 * - Student profile
 * - Linked User account
 * - Student attendance records
 *
 * The database schema uses cascade deletion for
 * the Student -> User/Attendance relationships.
 */
export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const { studentId } =
      await context.params;

    const parsedStudentId =
      parseStudentId(studentId);

    if (parsedStudentId === null) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid student ID.",
        },
        { status: 400 }
      );
    }

    /*
     * Find the student before deleting so
     * we can return useful information.
     */
    const student =
      await db.student.findUnique({
        where: {
          id: parsedStudentId,
        },

        select: {
          id: true,
          userId: true,
          hallTicket: true,
          name: true,
        },
      });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: "Student not found.",
        },
        { status: 404 }
      );
    }

    /*
     * Delete the student.
     *
     * Because the Prisma schema contains:
     *
     * Student -> User       onDelete: Cascade
     * Student -> Attendance onDelete: Cascade
     *
     * related records are removed automatically.
     */
    await db.student.delete({
      where: {
        id: parsedStudentId,
      },
    });

    return NextResponse.json({
      success: true,

      message:
        "Student deleted successfully.",

      data: {
        id: student.id,
        userId: student.userId,
        hallTicket: student.hallTicket,
        name: student.name,
      },
    });
  } catch (error) {
    console.error(
      "Delete student error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to delete student.",
      },
      { status: 500 }
    );
  }
}