import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    studentId: string;
  }>;
};

export async function GET(
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
      Number(studentId);

    if (
      !Number.isInteger(
        parsedStudentId
      ) ||
      parsedStudentId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid student ID.",
        },
        { status: 400 }
      );
    }

    const student =
      await db.student.findUnique({
        where: {
          id: parsedStudentId,
        },

        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },

          branch: true,

          studyYear: true,
        },
      });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Student not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,

      data: {
        id: student.id,

        hallTicket:
          student.hallTicket,

        name:
          student.name,

        email:
          student.email,

        phone:
          student.phone,

        isActive:
          student.isActive,

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

        account: {
          userId:
            student.user.id,

          username:
            student.user.username,

          role:
            student.user.role,

          status:
            student.user.status,

          createdAt:
            student.user.createdAt,

          updatedAt:
            student.user.updatedAt,
        },

        createdAt:
          student.createdAt,

        updatedAt:
          student.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Student details error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load student details.",
      },
      { status: 500 }
    );
  }
}