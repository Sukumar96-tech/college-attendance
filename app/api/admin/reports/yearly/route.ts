import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";

const querySchema = z.object({
  academicYearId: z.coerce.number().int().positive(),
});

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);

    const parsed = querySchema.safeParse({
      academicYearId: searchParams.get("academicYearId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid academic year is required.",
        },
        { status: 400 }
      );
    }

    const academicYearId = parsed.data.academicYearId;

    const academicYear = await db.academicYear.findUnique({
      where: { id: academicYearId },
      include: {
        semesters: {
          orderBy: { number: "asc" },
        },
      },
    });

    if (!academicYear) {
      return NextResponse.json(
        {
          success: false,
          message: "Academic year not found.",
        },
        { status: 404 }
      );
    }

    const sessions = await db.attendanceSession.findMany({
      where: {
        status: "COMPLETED",
        academicDay: {
          type: "WORKING_DAY",
          semester: {
            academicYearId,
          },
        },
      },
      include: {
        academicDay: {
          select: {
            id: true,
            date: true,
            remarks: true,
            semesterId: true,
            semester: {
              select: {
                id: true,
                name: true,
                number: true,
              },
            },
          },
        },
        attendance: {
          select: {
            studentId: true,
            status: true,
          },
        },
      },
      orderBy: {
        academicDay: {
          date: "asc",
        },
      },
    });

    const students = await db.student.findMany({
      where: {
        isActive: true,
        user: {
          role: "STUDENT",
          status: "APPROVED",
        },
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        hallTicket: "asc",
      },
    });

    const completedWorkingDays = sessions.length;

    const dates = sessions.map((session) => ({
      sessionId: session.id,
      date: session.academicDay.date,
      remarks: session.academicDay.remarks,
      semester: session.academicDay.semester,
    }));

    const studentReports = students.map((student) => {
      let presentDays = 0;
      let absentDays = 0;
      let unmarkedDays = 0;

      for (const session of sessions) {
        const record = session.attendance.find(
          (attendance) => attendance.studentId === student.id
        );

        if (record?.status === "PRESENT") {
          presentDays += 1;
        } else if (record?.status === "ABSENT") {
          absentDays += 1;
        } else {
          unmarkedDays += 1;
        }
      }

      const countedDays = presentDays + absentDays;

      const percentage =
        countedDays === 0
          ? 0
          : (presentDays / countedDays) * 100;

      return {
        studentId: student.id,
        hallTicket: student.hallTicket,
        name: student.name,
        year: student.year,
        section: student.section,
        branch: student.branch,
        academicYear: student.academicYear,
        presentDays,
        absentDays,
        unmarkedDays,
        countedDays,
        percentage: Number(
          Math.min(100, Math.max(0, percentage)).toFixed(2)
        ),
      };
    });

    const totalPresent = studentReports.reduce(
      (total, student) => total + student.presentDays,
      0
    );

    const totalAbsent = studentReports.reduce(
      (total, student) => total + student.absentDays,
      0
    );

    const totalCounted = totalPresent + totalAbsent;

    const overallPercentage =
      totalCounted === 0
        ? 0
        : (totalPresent / totalCounted) * 100;

    return NextResponse.json({
      success: true,
      data: {
        report: {
          type: "YEARLY",
          academicYear: {
            id: academicYear.id,
            name: academicYear.name,
            startDate: academicYear.startDate,
            endDate: academicYear.endDate,
          },
          summary: {
            completedWorkingDays,
            totalStudents: students.length,
            totalPresent,
            totalAbsent,
            overallPercentage: Number(
              Math.min(100, Math.max(0, overallPercentage)).toFixed(2)
            ),
          },
          dates,
          students: studentReports,
        },
      },
    });
  } catch (error) {
    console.error("Yearly attendance report error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to generate yearly attendance report.",
      },
      { status: 500 }
    );
  }
}
