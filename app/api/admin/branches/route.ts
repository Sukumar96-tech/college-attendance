import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const branches = await db.branch.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: branches,
    });
  } catch (error) {
    console.error(
      "Branch list error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load branches.",
      },
      { status: 500 }
    );
  }
}