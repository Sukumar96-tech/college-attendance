import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const registrations =
      await db.user.findMany({
        where: {
          role: "STUDENT",
          status: "PENDING",
        },

        include: {
          student: {
            include: {
              branch: true,
              studyYear: true,
            },
          },
        },

        orderBy: {
          createdAt: "asc",
        },
      });

    return NextResponse.json({
      success: true,

      data: registrations.map(
        (user) => ({
          userId: user.id,
          username: user.username,
          status: user.status,
          createdAt: user.createdAt,

          student: user.student
            ? {
                id: user.student.id,
                hallTicket:
                  user.student.hallTicket,
                name:
                  user.student.name,
                email:
                  user.student.email,

                branch:
                  user.student.branch.name,

                studyYear:
                  user.student.studyYear.name,
              }
            : null,
        })
      ),
    });
  } catch (error) {
    console.error(
      "Registration requests error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load registration requests.",
      },
      { status: 500 }
    );
  }
}