import { db } from "@/lib/db";

export async function getStudentAttendanceSummary(
  studentId: number
) {
  const completedSessions =
    await db.attendanceSession.findMany({
      where: {
        status: "COMPLETED",

        academicDay: {
          type: "WORKING_DAY",
        },
      },

      include: {
        attendance: {
          where: {
            studentId,
          },

          select: {
            status: true,
          },
        },

        academicDay: {
          select: {
            date: true,
          },
        },
      },

      orderBy: {
        academicDay: {
          date: "asc",
        },
      },
    });

  const completedWorkingDays =
    completedSessions.length;

  const presentDays =
    completedSessions.filter(
      (session) =>
        session.attendance[0]?.status ===
        "PRESENT"
    ).length;

  const absentDays =
    completedSessions.filter(
      (session) =>
        session.attendance[0]?.status ===
        "ABSENT"
    ).length;

  const percentage =
    completedWorkingDays === 0
      ? 0
      : (presentDays /
          completedWorkingDays) *
        100;

  return {
    totalWorkingDays:
      completedWorkingDays,

    presentDays,

    absentDays,

    percentage: Number(
      percentage.toFixed(2)
    ),
  };
}