import { requireStudent } from "@/lib/auth-guard";
import { getStudentAttendanceSummary } from "@/lib/attendance";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await requireStudent();

    if (auth.error) {
      return auth.error;
    }

    const student = auth.user!.student!;

    const summary =
      await getStudentAttendanceSummary(
        student.id
      );

    return NextResponse.json({
      success: true,

      data: {
        student: {
          id: student.id,

          hallTicket:
            student.hallTicket,

          name: student.name,
        },

        summary,
      },
    });
  } catch (error) {
    console.error(
      "Student attendance summary error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load attendance summary.",
      },
      { status: 500 }
    );
  }
}