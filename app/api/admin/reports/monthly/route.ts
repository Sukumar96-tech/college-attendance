import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

function parseMonth(value: string | null) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month] = value.split("-").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  return {
    year,
    month,
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

function parsePositiveInt(value: string | null) {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : null;
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const { searchParams } = new URL(request.url);

    const monthValue = searchParams.get("month");
    const branchId = parsePositiveInt(
      searchParams.get("branchId")
    );
    const studyYearId = parsePositiveInt(
      searchParams.get("studyYearId")
    );
    const semesterId = parsePositiveInt(
      searchParams.get("semesterId")
    );
    const download = searchParams.get("download");

    const parsedMonth = parseMonth(monthValue);

    if (!parsedMonth) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid month. Use the YYYY-MM format.",
        },
        { status: 400 }
      );
    }

    if (!branchId) {
      return NextResponse.json(
        {
          success: false,
          message: "Branch is required.",
        },
        { status: 400 }
      );
    }

    if (!studyYearId) {
      return NextResponse.json(
        {
          success: false,
          message: "Study Year is required.",
        },
        { status: 400 }
      );
    }

    if (!semesterId) {
      return NextResponse.json(
        {
          success: false,
          message: "Semester is required.",
        },
        { status: 400 }
      );
    }

    const [branch, studyYear, semester] =
      await Promise.all([
        db.branch.findFirst({
          where: {
            id: branchId,
            isActive: true,
          },
        }),

        db.studyYear.findFirst({
          where: {
            id: studyYearId,
            isActive: true,
          },
        }),

        db.semester.findFirst({
          where: {
            id: semesterId,
            studyYearId,
            isActive: true,
          },
        }),
      ]);

    if (!branch) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected branch not found or inactive.",
        },
        { status: 404 }
      );
    }

    if (!studyYear) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected study year not found or inactive.",
        },
        { status: 404 }
      );
    }

    if (!semester) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected semester was not found, is inactive, or does not belong to the selected study year.",
        },
        { status: 404 }
      );
    }

    if (
      parsedMonth.end <= semester.startDate ||
      parsedMonth.start >= semester.endDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected month is outside the configured semester period.",
        },
        { status: 400 }
      );
    }

    const academicDays = await db.academicDay.findMany({
      where: {
        semesterId,
        date: {
          gte: parsedMonth.start,
          lt: parsedMonth.end,
        },
        type: "WORKING_DAY",
      },
      include: {
        semester: {
          include: {
            studyYear: true,
          },
        },
        sessions: {
          where: {
            branchId,
            status: "COMPLETED",
          },
          include: {
            branch: true,
            attendance: {
              include: {
                student: {
                  include: {
                    branch: true,
                    studyYear: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    const completedSessions = academicDays.flatMap(
      (day) =>
        day.sessions.map((session) => ({
          day,
          session,
        }))
    );

    const activeStudents = await db.student.findMany({
      where: {
        branchId,
        studyYearId,
        isActive: true,
        user: {
          status: "APPROVED",
        },
      },
      include: {
        branch: true,
        studyYear: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const studentMap = new Map<
      number,
      {
        studentId: number;
        hallTicket: string;
        name: string;
        totalDays: number;
        presentDays: number;
        absentDays: number;
      }
    >();

    for (const student of activeStudents) {
      studentMap.set(student.id, {
        studentId: student.id,
        hallTicket: student.hallTicket,
        name: student.name,
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
      });
    }

    for (const { session } of completedSessions) {
      for (const record of session.attendance) {
        const student = record.student;

        if (
          student.branchId !== branchId ||
          student.studyYearId !== studyYearId ||
          !student.isActive ||
          student.user.status !== "APPROVED"
        ) {
          continue;
        }

        const studentSummary = studentMap.get(
          student.id
        );

        if (!studentSummary) {
          continue;
        }

        if (
          record.status !== "PRESENT" &&
          record.status !== "ABSENT"
        ) {
          continue;
        }

        studentSummary.totalDays += 1;

        if (record.status === "PRESENT") {
          studentSummary.presentDays += 1;
        } else {
          studentSummary.absentDays += 1;
        }
      }
    }

    const students = Array.from(studentMap.values()).map(
      (student) => ({
        ...student,
        percentage:
          student.totalDays === 0
            ? 0
            : Number(
                (
                  (student.presentDays /
                    student.totalDays) *
                  100
                ).toFixed(2)
              ),
      })
    );

    const totalPresent = students.reduce(
      (sum, student) => sum + student.presentDays,
      0
    );

    const totalAbsent = students.reduce(
      (sum, student) => sum + student.absentDays,
      0
    );

    const totalAttendanceRecords =
      totalPresent + totalAbsent;

    const overallPercentage =
      totalAttendanceRecords === 0
        ? 0
        : Number(
            (
              (totalPresent /
                totalAttendanceRecords) *
              100
            ).toFixed(2)
          );

    const report = {
      type: "MONTHLY" as const,
      month: monthValue,
      monthName: new Date(
        Date.UTC(
          parsedMonth.year,
          parsedMonth.month - 1,
          1
        )
      ).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),

      branch: {
        id: branch.id,
        name: branch.name,
        code: branch.code,
      },

      studyYear: {
        id: studyYear.id,
        name: studyYear.name,
        number: studyYear.number,
      },

      semester: {
        id: semester.id,
        name: semester.name,
        number: semester.number,
        startDate: semester.startDate,
        endDate: semester.endDate,
      },

      summary: {
        totalWorkingDays: academicDays.length,
        completedAttendanceDays:
          completedSessions.length,
        pendingAttendanceDays:
          academicDays.length -
          completedSessions.length,
        totalAttendanceRecords,
        presentRecords: totalPresent,
        absentRecords: totalAbsent,
        percentage: overallPercentage,
      },

      students,

      days: completedSessions.map(
        ({ day, session }) => ({
          academicDayId: day.id,
          date: day.date,
          sessionId: session.id,
          status: session.status,
          completedAt: session.completedAt,
          presentStudents:
            session.attendance.filter(
              (record) =>
                record.status === "PRESENT"
            ).length,
          absentStudents:
            session.attendance.filter(
              (record) =>
                record.status === "ABSENT"
            ).length,
        })
      ),
    };

    if (download === "csv") {
      const lines: string[] = [];

      lines.push(
        [
          "Monthly Attendance Report",
        ]
          .map(csvEscape)
          .join(",")
      );

      lines.push(
        [
          "Month",
          report.monthName,
        ]
          .map(csvEscape)
          .join(",")
      );

      lines.push(
        [
          "Branch",
          branch.name,
        ]
          .map(csvEscape)
          .join(",")
      );

      lines.push(
        [
          "Branch Code",
          branch.code,
        ]
          .map(csvEscape)
          .join(",")
      );

      lines.push(
        [
          "Study Year",
          studyYear.name,
        ]
          .map(csvEscape)
          .join(",")
      );

      lines.push(
        [
          "Semester",
          semester.name,
        ]
          .map(csvEscape)
          .join(",")
      );

      lines.push(
        [
          "Semester Period",
          `${semester.startDate.toISOString()} - ${semester.endDate.toISOString()}`,
        ]
          .map(csvEscape)
          .join(",")
      );

      lines.push("");

      lines.push(
        [
          "Total Working Days",
          report.summary.totalWorkingDays,
        ]
          .map(csvEscape)
          .join(",")
      );

      lines.push(
        [
          "Completed Attendance Days",
          report.summary.completedAttendanceDays,
        ]
          .map(csvEscape)
          .join(",")
      );

      lines.push(
        [
          "Pending Attendance Days",
          report.summary.pendingAttendanceDays,
        ]
          .map(csvEscape)
          .join(",")
      );

      lines.push("");

      lines.push(
        [
          "S.No",
          "Hall Ticket",
          "Student Name",
          "Present Days",
          "Absent Days",
          "Days Counted",
          "Percentage",
        ]
          .map(csvEscape)
          .join(",")
      );

      students.forEach((student, index) => {
        lines.push(
          [
            index + 1,
            student.hallTicket,
            student.name,
            student.presentDays,
            student.absentDays,
            student.totalDays,
            `${student.percentage}%`,
          ]
            .map(csvEscape)
            .join(",")
        );
      });

      const csv = "\uFEFF" + lines.join("\r\n");

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type":
            "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="monthly-attendance-${branch.code}-${studyYear.number}-semester-${semester.number}-${monthValue}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        report,
      },
    });
  } catch (error) {
    console.error(
      "Monthly report error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to generate monthly report.",
      },
      { status: 500 }
    );
  }
}
