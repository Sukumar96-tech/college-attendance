/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `AcademicYear` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_name_key" ON "AcademicYear"("name");
