import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const [
      totalStudents,
      activeStudents,
      pendingRegistrations,
      approvedStudents,
      rejectedRegistrations,
      totalBranches,
      activeStudyYears,
    ] = await Promise.all([
      db.student.count(),

      db.student.count({
        where: {
          isActive: true,
        },
      }),

      db.user.count({
        where: {
          role: "STUDENT",
          status: "PENDING",
        },
      }),

      db.user.count({
        where: {
          role: "STUDENT",
          status: "APPROVED",
        },
      }),

      db.user.count({
        where: {
          role: "STUDENT",
          status: "REJECTED",
        },
      }),

      db.branch.count({
        where: {
          isActive: true,
        },
      }),

      db.studyYear.count({
        where: {
          isActive: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,

      data: {
        students: {
          total: totalStudents,
          active: activeStudents,
        },

        registrations: {
          pending: pendingRegistrations,
          approved: approvedStudents,
          rejected: rejectedRegistrations,
        },

        branches: totalBranches,

        studyYears: activeStudyYears,
      },
    });
  } catch (error) {
    console.error(
      "Admin dashboard error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load dashboard data.",
      },
      { status: 500 }
    );
  }
}