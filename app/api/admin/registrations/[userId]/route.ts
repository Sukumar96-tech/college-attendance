import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
});

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const { userId } = await context.params;

    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const result = actionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid action.",
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { action } = result.data;

    const user = await db.user.findUnique({
      where: {
        id: parsedUserId,
      },
      include: {
        student: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Student account not found.",
        },
        { status: 404 }
      );
    }

    if (user.role !== "STUDENT") {
      return NextResponse.json(
        {
          success: false,
          message: "This account is not a student account.",
        },
        { status: 400 }
      );
    }

    if (user.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          message: `This registration is already ${user.status.toLowerCase()}.`,
        },
        { status: 409 }
      );
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    const updatedUser = await db.user.update({
      where: {
        id: parsedUserId,
      },
      data: {
        status: newStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        action === "APPROVE"
          ? "Student registration approved successfully."
          : "Student registration rejected successfully.",
      data: {
        userId: updatedUser.id,
        username: updatedUser.username,
        status: updatedUser.status,
        studentId: user.student?.id ?? null,
      },
    });
  } catch (error) {
    console.error("Registration approval error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update registration.",
      },
      { status: 500 }
    );
  }
}