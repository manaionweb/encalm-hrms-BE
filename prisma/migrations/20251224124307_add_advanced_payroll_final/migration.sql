/*
  Warnings:

  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "TaxRegimeSelection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "financialYear" TEXT NOT NULL,
    "regime" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaxRegimeSelection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TaxRegimeSelection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvestmentDeclaration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "financialYear" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "proofUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvestmentDeclaration_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InvestmentDeclaration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SalaryComponent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "taxability" TEXT NOT NULL DEFAULT 'TAXABLE',
    "isTaxable" BOOLEAN NOT NULL DEFAULT true,
    "isWageCodeComponent" BOOLEAN NOT NULL DEFAULT false,
    "isPartOfWages" BOOLEAN NOT NULL DEFAULT false,
    "isFBP" BOOLEAN NOT NULL DEFAULT false,
    "prorationMethod" TEXT NOT NULL DEFAULT 'CALENDAR_DAYS',
    "calculationType" TEXT NOT NULL DEFAULT 'FLAT',
    "value" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalaryComponent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SalaryComponent" ("calculationType", "createdAt", "id", "isFBP", "isPartOfWages", "isTaxable", "name", "tenantId", "type", "updatedAt", "value") SELECT "calculationType", "createdAt", "id", "isFBP", "isPartOfWages", "isTaxable", "name", "tenantId", "type", "updatedAt", "value" FROM "SalaryComponent";
DROP TABLE "SalaryComponent";
ALTER TABLE "new_SalaryComponent" RENAME TO "SalaryComponent";
CREATE TABLE "new_StatutorySettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "epfEnabled" BOOLEAN NOT NULL DEFAULT true,
    "epfNumber" TEXT,
    "epfWageCeiling" BOOLEAN NOT NULL DEFAULT true,
    "pfCeilingType" TEXT NOT NULL DEFAULT 'STATUTORY_15K',
    "epfEmployeeRate" REAL NOT NULL DEFAULT 12.0,
    "epfEmployerRate" REAL NOT NULL DEFAULT 3.67,
    "epsEmployerRate" REAL NOT NULL DEFAULT 8.33,
    "edliEmployerRate" REAL NOT NULL DEFAULT 0.50,
    "adminChargesRate" REAL NOT NULL DEFAULT 0.50,
    "esicEnabled" BOOLEAN NOT NULL DEFAULT true,
    "esicNumber" TEXT,
    "esicWageLimit" REAL NOT NULL DEFAULT 21000,
    "esicEmployeeRate" REAL NOT NULL DEFAULT 0.75,
    "esicEmployerRate" REAL NOT NULL DEFAULT 3.25,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StatutorySettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StatutorySettings" ("epfEmployeeRate", "epfEmployerRate", "epfEnabled", "epfNumber", "epfWageCeiling", "esicEmployeeRate", "esicEmployerRate", "esicEnabled", "esicNumber", "esicWageLimit", "id", "tenantId", "updatedAt") SELECT "epfEmployeeRate", "epfEmployerRate", "epfEnabled", "epfNumber", "epfWageCeiling", "esicEmployeeRate", "esicEmployerRate", "esicEnabled", "esicNumber", "esicWageLimit", "id", "tenantId", "updatedAt" FROM "StatutorySettings";
DROP TABLE "StatutorySettings";
ALTER TABLE "new_StatutorySettings" RENAME TO "StatutorySettings";
CREATE UNIQUE INDEX "StatutorySettings_tenantId_key" ON "StatutorySettings"("tenantId");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "roleId" INTEGER,
    "managerId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "id", "managerId", "name", "password", "roleId", "tenantId") SELECT "createdAt", "email", "id", "managerId", "name", "password", "roleId", "tenantId" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_tenantId_key" ON "User"("email", "tenantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TaxRegimeSelection_userId_financialYear_key" ON "TaxRegimeSelection"("userId", "financialYear");
