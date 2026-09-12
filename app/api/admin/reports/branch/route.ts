import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const { searchParams } = new URL(
      request.url
    );

    const branchIdParam =
      searchParams.get("branchId");

    const academicYearIdParam =
      searchParams.get("academicYearId");

    if (!branchIdParam) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Branch is required.",
        },
        { status: 400 }
      );
    }

    const branchId = Number(
      branchIdParam
    );

    if (
      !Number.isInteger(branchId) ||
      branchId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid branch ID.",
        },
        { status: 400 }
      );
    }

    let academicYearId:
      | number
      | undefined;

    if (academicYearIdParam) {
      academicYearId = Number(
        academicYearIdParam
      );

      if (
        !Number.isInteger(
          academicYearId
        ) ||
        academicYearId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid academic year ID.",
          },
          { status: 400 }
        );
      }
    }

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
            "Branch not found.",
        },
        { status: 404 }
      );
    }

    const students =
      await db.student.findMany({
        where: {
          branchId,

          isActive: true,

          user: {
            role: "STUDENT",
            status: "APPROVED",
          },

          ...(academicYearId
            ? {
                academicYearId,
              }
            : {}),
        },

        include: {
          branch: true,
          academicYear: true,
        },

        orderBy: {
          hallTicket: "asc",
        },
      });

    const workingDayWhere = {
      type: "WORKING_DAY" as const,

      session: {
        status: "COMPLETED" as const,
      },

      ...(academicYearId
        ? {
            semester: {
              academicYearId,
            },
          }
        : {}),
    };

    const workingDays =
      await db.academicDay.findMany({
        where: workingDayWhere,

        include: {
          session: {
            include: {
              attendance: {
                select: {
                  studentId: true,
                  status: true,
                },
              },
            },
          },

          semester: {
            include: {
              academicYear: true,
            },
          },
        },

        orderBy: {
          date: "asc",
        },
      });

    const completedWorkingDays =
      workingDays.length;

    const reportStudents =
      students.map((student) => {
        let presentDays = 0;
        let absentDays = 0;

        for (const day of workingDays) {
          const attendance =
            day.session?.attendance.find(
              (record) =>
                record.studentId ===
                student.id
            );

          if (
            attendance?.status ===
            "PRESENT"
          ) {
            presentDays++;
          }

          if (
            attendance?.status ===
            "ABSENT"
          ) {
            absentDays++;
          }
        }

        const percentage =
          completedWorkingDays === 0
            ? 0
            : (presentDays /
                completedWorkingDays) *
              100;

        return {
          studentId:
            student.id,

          hallTicket:
            student.hallTicket,

          name:
            student.name,

          branch: {
            id:
              student.branch.id,

            name:
              student.branch.name,

            code:
              student.branch.code,
          },

          academicYear: {
            id:
              student.academicYear.id,

            name:
              student.academicYear.name,
          },

          year:
            student.year,

          section:
            student.section,

          presentDays,

          absentDays,

          percentage:
            Number(
              percentage.toFixed(2)
            ),
        };
      });

    const totalPresent =
      reportStudents.reduce(
        (total, student) =>
          total +
          student.presentDays,
        0
      );

    const totalAbsent =
      reportStudents.reduce(
        (total, student) =>
          total +
          student.absentDays,
        0
      );

    const totalPossibleAttendance =
      completedWorkingDays *
      students.length;

    const overallPercentage =
      totalPossibleAttendance ===
      0
        ? 0
        : (totalPresent /
            totalPossibleAttendance) *
          100;

    return NextResponse.json({
      success: true,

      data: {
        branch: {
          id: branch.id,
          name: branch.name,
          code: branch.code,
          isActive:
            branch.isActive,
        },

        academicYear: academicYearId
          ? await db.academicYear.findUnique(
              {
                where: {
                  id: academicYearId,
                },

                select: {
                  id: true,
                  name: true,
                  startDate: true,
                  endDate: true,
                },
              }
            )
          : null,

        summary: {
          completedWorkingDays,

          totalStudents:
            students.length,

          totalPresent,

          totalAbsent,

          overallPercentage:
            Number(
              overallPercentage.toFixed(
                2
              )
            ),
        },

        workingDays:
          workingDays.map(
            (day) => ({
              id: day.id,

              date: day.date,

              remarks:
                day.remarks,

              semester: {
                id:
                  day.semester.id,

                name:
                  day.semester.name,

                number:
                  day.semester.number,

                academicYear:
                  day.semester
                    .academicYear.name,
              },
            })
          ),

        students:
          reportStudents,
      },
    });
  } catch (error) {
    console.error(
      "Branch-wise attendance report error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to generate branch-wise attendance report.",
      },
      {
        status: 500,
      }
    );
  }
}