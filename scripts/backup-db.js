const fs = require("fs");
const path = require("path");

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

if (!fs.existsSync(databasePath)) {
  console.error(
    "Database file not found:"
  );

  console.error(databasePath);

  process.exit(1);
}

if (
  !fs.existsSync(backupDirectory)
) {
  fs.mkdirSync(
    backupDirectory,
    {
      recursive: true,
    }
  );
}

const now = new Date();

function pad(value) {
  return String(value).padStart(2, "0");
}

const timestamp =
  `${now.getFullYear()}-` +
  `${pad(now.getMonth() + 1)}-` +
  `${pad(now.getDate())}-` +
  `${pad(now.getHours())}-` +
  `${pad(now.getMinutes())}-` +
  `${pad(now.getSeconds())}`;

const backupFileName =
  `attendance-backup-${timestamp}.db`;

const backupPath = path.join(
  backupDirectory,
  backupFileName
);

try {
  fs.copyFileSync(
    databasePath,
    backupPath
  );

  const databaseSize =
    fs.statSync(
      databasePath
    ).size;

  const backupSize =
    fs.statSync(
      backupPath
    ).size;

  if (
    databaseSize !==
    backupSize
  ) {
    console.error(
      "Backup verification failed."
    );

    fs.unlinkSync(
      backupPath
    );

    process.exit(1);
  }

  console.log(
    "Database backup created successfully."
  );

  console.log(
    `Backup: ${backupPath}`
  );

  console.log(
    `Size: ${backupSize} bytes`
  );
} catch (error) {
  console.error(
    "Database backup failed:"
  );

  console.error(error);

  process.exit(1);
}