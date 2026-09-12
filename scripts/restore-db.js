const fs = require("fs");
const path = require("path");
const readline = require("readline");

const projectRoot = path.resolve(
  __dirname,
  ".."
);

const databasePath = path.join(
  projectRoot,
  "prisma",
  "dev.db"
);

const backupDirectory = path.join(
  projectRoot,
  "backup"
);

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function getBackupFiles() {
  if (
    !fs.existsSync(backupDirectory)
  ) {
    return [];
  }

  return fs
    .readdirSync(backupDirectory)
    .filter((file) =>
      /^attendance-backup-.*\.db$/.test(
        file
      )
    )
    .sort()
    .reverse();
}

async function main() {
  console.log(
    "\nCollege Attendance Management System"
  );

  console.log(
    "Database Restore Utility\n"
  );

  if (
    !fs.existsSync(databasePath)
  ) {
    console.error(
      "Current database was not found:"
    );

    console.error(databasePath);

    process.exit(1);
  }

  const backupFiles =
    getBackupFiles();

  if (backupFiles.length === 0) {
    console.error(
      "No database backup files were found."
    );

    console.error(
      `Backup folder: ${backupDirectory}`
    );

    process.exit(1);
  }

  console.log(
    "Available backups:\n"
  );

  backupFiles.forEach(
    (file, index) => {
      console.log(
        `${index + 1}. ${file}`
      );
    }
  );

  console.log("");

  const answer =
    await askQuestion(
      "Enter the backup number to restore: "
    );

  const selectedIndex =
    Number(answer) - 1;

  if (
    !Number.isInteger(
      selectedIndex
    ) ||
    selectedIndex < 0 ||
    selectedIndex >=
      backupFiles.length
  ) {
    console.error(
      "Invalid backup selection."
    );

    process.exit(1);
  }

  const selectedBackup =
    backupFiles[selectedIndex];

  const backupPath = path.join(
    backupDirectory,
    selectedBackup
  );

  if (
    !fs.existsSync(backupPath)
  ) {
    console.error(
      "Selected backup file was not found."
    );

    process.exit(1);
  }

  console.log(
    `\nSelected backup: ${selectedBackup}`
  );

  console.log(
    "\nWARNING: Restoring this backup will replace the current database."
  );

  const confirmation =
    await askQuestion(
      'Type "RESTORE" to continue: '
    );

  if (
    confirmation !== "RESTORE"
  ) {
    console.log(
      "\nRestore cancelled."
    );

    process.exit(0);
  }

  /*
   * Create an emergency backup of the
   * current database before replacing it.
   */

  const now = new Date();

  function pad(value) {
    return String(value).padStart(
      2,
      "0"
    );
  }

  const timestamp =
    `${now.getFullYear()}-` +
    `${pad(now.getMonth() + 1)}-` +
    `${pad(now.getDate())}-` +
    `${pad(now.getHours())}-` +
    `${pad(now.getMinutes())}-` +
    `${pad(now.getSeconds())}`;

  const emergencyBackupName =
    `attendance-before-restore-${timestamp}.db`;

  const emergencyBackupPath =
    path.join(
      backupDirectory,
      emergencyBackupName
    );

  try {
    fs.copyFileSync(
      databasePath,
      emergencyBackupPath
    );

    console.log(
      "\nEmergency backup created:"
    );

    console.log(
      emergencyBackupName
    );

    /*
     * Copy the selected backup over
     * the current database.
     */

    fs.copyFileSync(
      backupPath,
      databasePath
    );

    /*
     * Verify that the restored file exists
     * and has a valid non-zero size.
     */

    const restoredSize =
      fs.statSync(
        databasePath
      ).size;

    if (restoredSize === 0) {
      console.error(
        "\nRestore verification failed."
      );

      /*
       * Put the emergency backup back.
       */

      fs.copyFileSync(
        emergencyBackupPath,
        databasePath
      );

      console.error(
        "The previous database has been restored."
      );

      process.exit(1);
    }

    console.log(
      "\nDatabase restored successfully."
    );

    console.log(
      `Restored from: ${selectedBackup}`
    );

    console.log(
      `Database: ${databasePath}`
    );

    console.log(
      `Database size: ${restoredSize} bytes`
    );

    console.log(
      "\nPlease restart the Next.js application before using the system."
    );
  } catch (error) {
    console.error(
      "\nDatabase restore failed:"
    );

    console.error(error);

    /*
     * Attempt to restore the emergency backup.
     */

    try {
      if (
        fs.existsSync(
          emergencyBackupPath
        )
      ) {
        fs.copyFileSync(
          emergencyBackupPath,
          databasePath
        );

        console.error(
          "The previous database was restored from the emergency backup."
        );
      }
    } catch (rollbackError) {
      console.error(
        "Automatic rollback also failed:"
      );

      console.error(
        rollbackError
      );
    }

    process.exit(1);
  }
}

main();