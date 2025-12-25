/*
  Warnings:

  - You are about to drop the `LeavePolicy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `locations` on the `Holiday` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Leave` table. All the data in the column will be lost.
  - You are about to drop the column `halfDayThreshold` on the `Shift` table. All the data in the column will be lost.
  - Added the required column `leaveTypeId` to the `Leave` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "LeavePolicy";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "AttendancePolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "minHalfDayHours" REAL NOT NULL DEFAULT 4.0,
    "minFullDayHours" REAL NOT NULL DEFAULT 8.0,
    "lateMarkThreshold" INTEGER NOT NULL DEFAULT 3,
    "lateMarkDeduction" TEXT NOT NULL DEFAULT 'HALF_DAY',
    "otEnabled" BOOLEAN NOT NULL DEFAULT true,
    "otStartAfterShift" BOOLEAN NOT NULL DEFAULT true,
    "otRate" REAL NOT NULL DEFAULT 2.0,
    "regularizationDays" INTEGER NOT NULL DEFAULT 3,
    "lockDate" INTEGER,
    "compOffExpiryDays" INTEGER NOT NULL DEFAULT 60,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AttendancePolicy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Holiday" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "stateId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Holiday_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Holiday_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Holiday" ("createdAt", "date", "id", "name", "tenantId", "type", "updatedAt") SELECT "createdAt", "date", "id", "name", "tenantId", "type", "updatedAt" FROM "Holiday";
DROP TABLE "Holiday";
ALTER TABLE "new_Holiday" RENAME TO "Holiday";
CREATE TABLE "new_Leave" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "leaveTypeId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "userId" INTEGER NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Leave_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Leave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Leave_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Leave" ("createdAt", "endDate", "id", "reason", "startDate", "status", "tenantId", "userId") SELECT "createdAt", "endDate", "id", "reason", "startDate", "status", "tenantId", "userId" FROM "Leave";
DROP TABLE "Leave";
ALTER TABLE "new_Leave" RENAME TO "Leave";
CREATE TABLE "new_LeaveType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "daysPerYear" REAL NOT NULL,
    "accrualFrequency" TEXT NOT NULL DEFAULT 'YEARLY',
    "carryForward" BOOLEAN NOT NULL DEFAULT false,
    "maxCarryForward" REAL,
    "encashable" BOOLEAN NOT NULL DEFAULT false,
    "encashmentFormula" TEXT,
    "isMaternity" BOOLEAN NOT NULL DEFAULT false,
    "sandwichRule" BOOLEAN NOT NULL DEFAULT false,
    "noticePeriodDays" INTEGER NOT NULL DEFAULT 0,
    "allowDuringNoticePeriod" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LeaveType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LeaveType" ("carryForward", "code", "createdAt", "daysPerYear", "encashable", "id", "isMaternity", "name", "sandwichRule", "tenantId", "updatedAt") SELECT "carryForward", "code", "createdAt", "daysPerYear", "encashable", "id", "isMaternity", "name", "sandwichRule", "tenantId", "updatedAt" FROM "LeaveType";
DROP TABLE "LeaveType";
ALTER TABLE "new_LeaveType" RENAME TO "LeaveType";
CREATE TABLE "new_Shift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakDuration" INTEGER NOT NULL,
    "graceTime" INTEGER NOT NULL DEFAULT 15,
    "isNightShift" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Shift_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Shift" ("breakDuration", "createdAt", "endTime", "graceTime", "id", "name", "startTime", "tenantId", "updatedAt") SELECT "breakDuration", "createdAt", "endTime", "graceTime", "id", "name", "startTime", "tenantId", "updatedAt" FROM "Shift";
DROP TABLE "Shift";
ALTER TABLE "new_Shift" RENAME TO "Shift";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AttendancePolicy_tenantId_key" ON "AttendancePolicy"("tenantId");
