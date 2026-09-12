import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required."),

    newPassword: z
      .string()
      .min(
        8,
        "New password must be at least 8 characters long."
      )
      .max(
        128,
        "New password must not exceed 128 characters."
      ),

    confirmPassword: z
      .string()
      .min(1, "Confirm password is required."),
  })
  .refine(
    (data) =>
      data.newPassword === data.confirmPassword,
    {
      message: "New passwords do not match.",
      path: ["confirmPassword"],
    }
  );

export async function PATCH(
  request: Request
) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const body = await request.json();

    const validation =
      passwordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            validation.error.issues[0]
              ?.message ||
            "Invalid password data.",
        },
        { status: 400 }
      );
    }

    const {
      currentPassword,
      newPassword,
    } = validation.data;

    const admin = await db.user.findUnique({
      where: {
        id: auth.session!.userId,
      },
      select: {
        id: true,
        passwordHash: true,
        role: true,
        status: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin account not found.",
        },
        { status: 401 }
      );
    }

    if (
      admin.role !== "ADMIN" ||
      admin.status !== "APPROVED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin account is not authorized.",
        },
        { status: 403 }
      );
    }

    const currentPasswordIsValid =
      await bcrypt.compare(
        currentPassword,
        admin.passwordHash
      );

    if (!currentPasswordIsValid) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Current password is incorrect.",
        },
        { status: 400 }
      );
    }

    const samePassword =
      await bcrypt.compare(
        newPassword,
        admin.passwordHash
      );

    if (samePassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "New password must be different from the current password.",
        },
        { status: 400 }
      );
    }

    const newPasswordHash =
      await bcrypt.hash(
        newPassword,
        12
      );

    await db.user.update({
      where: {
        id: admin.id,
      },
      data: {
        passwordHash:
          newPasswordHash,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Password changed successfully.",
    });
  } catch (error) {
    console.error(
      "Admin password change error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to change password.",
      },
      { status: 500 }
    );
  }
}