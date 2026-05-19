import { Router } from "express";
import {
  getDashboard,
  getAttendance,
  getPayroll,
  exportMonthlyAttendance,
  exportLeaveBalance,
  exportSalaryRegister,
  createAttendance,
  createLeave,
  createEmployeeProfile,
  createSalary,
  // createUser,
  // createTenant,
  // createLeaveType
} from "../controllers/report.controller";

const router = Router();

// ================= REPORT APIs.. =================

// Dashboard (REQUIRED: tenantId)
router.get("/dashboard", getDashboard);

// Attendance graph
router.get("/attendance", getAttendance);

// Payroll by department
router.get("/payroll", getPayroll);

// Exports
router.get("/export/attendance", exportMonthlyAttendance);
router.get("/export/salary", exportSalaryRegister);
router.get("/export/leave", exportLeaveBalance);

// ================= TEST CREATE APIs =================
// (Use for Postman testing only)

router.post("/test/attendance", createAttendance);
router.post("/test/leave", createLeave);
router.post("/test/employee", createEmployeeProfile);
router.post("/test/salary", createSalary);


// .............  ......testing..................

// router.post("/test/tenant", createTenant);
// router.post("/test/leavetype", createLeaveType);

// router.post("/test/user", createUser);

export default router;