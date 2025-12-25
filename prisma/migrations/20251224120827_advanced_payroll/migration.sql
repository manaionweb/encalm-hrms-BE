/*
  Warnings:

  - You are about to drop the `StatutorySlab` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `isFixed` on the `SalaryComponent` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "StatutorySlab";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "StatutorySettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "epfEnabled" BOOLEAN NOT NULL DEFAULT true,
    "epfNumber" TEXT,
    "epfWageCeiling" BOOLEAN NOT NULL DEFAULT true,
    "epfEmployeeRate" REAL NOT NULL DEFAULT 12.0,
    "epfEmployerRate" REAL NOT NULL DEFAULT 12.0,
    "esicEnabled" BOOLEAN NOT NULL DEFAULT true,
    "esicNumber" TEXT,
    "esicWageLimit" REAL NOT NULL DEFAULT 21000,
    "esicEmployeeRate" REAL NOT NULL DEFAULT 0.75,
    "esicEmployerRate" REAL NOT NULL DEFAULT 3.25,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StatutorySettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfessionalTaxSlab" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'ALL',
    "minSalary" REAL NOT NULL,
    "maxSalary" REAL,
    "taxAmount" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProfessionalTaxSlab_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProfessionalTaxSlab_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SalaryComponent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isTaxable" BOOLEAN NOT NULL DEFAULT true,
    "isPartOfWages" BOOLEAN NOT NULL DEFAULT false,
    "isFBP" BOOLEAN NOT NULL DEFAULT false,
    "calculationType" TEXT NOT NULL DEFAULT 'FLAT',
    "value" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalaryComponent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SalaryComponent" ("createdAt", "id", "isTaxable", "name", "tenantId", "type", "updatedAt") SELECT "createdAt", "id", "isTaxable", "name", "tenantId", "type", "updatedAt" FROM "SalaryComponent";
DROP TABLE "SalaryComponent";
ALTER TABLE "new_SalaryComponent" RENAME TO "SalaryComponent";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "StatutorySettings_tenantId_key" ON "StatutorySettings"("tenantId");
