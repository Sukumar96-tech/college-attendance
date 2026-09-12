import { requireAdmin } from "@/lib/auth-guard";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

function getDatabasePath() {
  const databaseUrl =
    process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not configured."
    );
  }

  if (!databaseUrl.startsWith("file:")) {
    throw new Error(
      "Backup and restore currently supports SQLite databases only."
    );
  }

  let databasePath =
    databaseUrl.substring("file:".length);

  if (
    databasePath.startsWith("./") ||
    databasePath.startsWith(".\\")
  ) {
    databasePath = path.resolve(
      process.cwd(),
      databasePath
    );
  } else if (!path.isAbsolute(databasePath)) {
    databasePath = path.resolve(
      process.cwd(),
      databasePath
    );
  }

  return databasePath;
}

function isAllowedDatabaseFile(
  fileName: string
) {
  const extension =
    path.extname(fileName).toLowerCase();

  return (
    extension === ".db" ||
    extension === ".sqlite" ||
    extension === ".sqlite3"
  );
}

export async function GET() {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const databasePath =
      getDatabasePath();

    const database = await fs.readFile(
      databasePath
    );

    const date = new Date();

    const timestamp =
      date
        .toISOString()
        .replace(/[:.]/g, "-");

    const fileName =
      `attendance-backup-${timestamp}.db`;

    return new NextResponse(database, {
      status: 200,
      headers: {
        "Content-Type":
          "application/octet-stream",

        "Content-Disposition":
          `attachment; filename="${fileName}"`,

        "Content-Length":
          database.byteLength.toString(),

        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error(
      "Database backup API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create database backup.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const auth = await requireAdmin();

    if (auth.error) {
      return auth.error;
    }

    const formData =
      await request.formData();

    const file =
      formData.get("backup");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please upload a database backup file.",
        },
        { status: 400 }
      );
    }

    if (!isAllowedDatabaseFile(file.name)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid backup file. Please upload a .db, .sqlite, or .sqlite3 file.",
        },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The uploaded backup file is empty.",
        },
        { status: 400 }
      );
    }

    const databasePath =
      getDatabasePath();

    /*
     * Keep a safety copy of the current
     * database before replacing it.
     */
    const safetyBackupPath =
      `${databasePath}.before-restore-${Date.now()}.bak`;

    await fs.copyFile(
      databasePath,
      safetyBackupPath
    );

    const uploadedBuffer =
      Buffer.from(
        await file.arrayBuffer()
      );

    /*
     * Basic SQLite file validation.
     * A SQLite database begins with:
     * "SQLite format 3\0"
     */
    const sqliteHeader =
      Buffer.from(
        "SQLite format 3\0",
        "utf8"
      );

    const hasValidSQLiteHeader =
      uploadedBuffer.length >=
        sqliteHeader.length &&
      uploadedBuffer
        .subarray(
          0,
          sqliteHeader.length
        )
        .equals(sqliteHeader);

    if (!hasValidSQLiteHeader) {
      await fs.unlink(
        safetyBackupPath
      ).catch(() => {});

      return NextResponse.json(
        {
          success: false,
          message:
            "The uploaded file is not a valid SQLite database.",
        },
        { status: 400 }
      );
    }

    /*
     * Write the uploaded database to a
     * temporary file first.
     */
    const temporaryPath =
      `${databasePath}.restore-${Date.now()}.tmp`;

    await fs.writeFile(
      temporaryPath,
      uploadedBuffer
    );

    /*
     * Replace the current database.
     */
    await fs.rename(
      temporaryPath,
      databasePath
    );

    return NextResponse.json({
      success: true,
      message:
        "Database restored successfully. Restart the application server before continuing to use the system.",
    });
  } catch (error) {
    console.error(
      "Database restore API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to restore the database.",
      },
      { status: 500 }
    );
  }
}