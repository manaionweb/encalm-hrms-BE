const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const TENANT_ID = '1e3be177-ffd4-4ea7-86b5-eb50f1b9d0f5';

// Existing IDs from DB
const SHIFTS = {
  morning: 'aae97e1d-58d2-46dc-b003-d5d2bf4f0507',
  evening: '2a7a9ec6-f43c-46fe-9f4b-57a7added3f6',
  night:   'fce79079-b30a-4c38-8a57-dc6f8734c0ef',
};

const LEAVE_TYPES = {
  CL: '5e47a35d-ab7b-4b02-a697-d21b3cdf2c07',
  SL: 'f6f2a083-72b3-41f4-8470-10ba516cd50b',
  EL: '6a1d00a3-053a-4112-b4d4-07bd1946ea5d',
};

const DEPTS = {
  HR:          '3100c8cf-7dd4-4b98-9873-6df3d5b13ebe',
  Operations:  '3dff4a07-e146-42ba-a2fc-c69559366de1',
  Design:      '2c99411d-721c-407f-922a-cd47cefd373d',
  Product:     '99b4477a-7c62-45f7-b147-00c53aed270b',
  Engineering: 'eb58d344-1294-4325-91e8-bd444475a80c',
};

const DESIG_DEV = '28be3151-9583-443b-a826-bf46adc3caf9';

// All employee users (excluding admin id:1)
const EMPLOYEES = [
  { id: 2,  name: 'Raman Thakur',       dept: DEPTS.HR,          shift: SHIFTS.morning, title: 'HR Executive',        basic: 35000, hra: 17500, special: 5000, medical: 1250 },
  { id: 3,  name: 'Aryan Karmani',      dept: DEPTS.Engineering, shift: SHIFTS.morning, title: 'Software Engineer',   basic: 45000, hra: 22500, special: 8000, medical: 1250 },
  { id: 4,  name: 'Heel Ndk',           dept: DEPTS.Design,      shift: SHIFTS.morning, title: 'UI/UX Designer',      basic: 38000, hra: 19000, special: 6000, medical: 1250 },
  { id: 5,  name: 'Keshav',             dept: DEPTS.Operations,  shift: SHIFTS.evening, title: 'Operations Analyst',  basic: 32000, hra: 16000, special: 4000, medical: 1250 },
  { id: 6,  name: 'Aryan Karmani 2',    dept: DEPTS.Engineering, shift: SHIFTS.night,   title: 'Backend Developer',   basic: 48000, hra: 24000, special: 9000, medical: 1250 },
  { id: 9,  name: 'Shubham Thakur',     dept: DEPTS.Product,     shift: SHIFTS.morning, title: 'Product Manager',     basic: 55000, hra: 27500, special: 10000, medical: 1250 },
  { id: 10, name: 'Shubham Sharma',     dept: DEPTS.Engineering, shift: SHIFTS.morning, title: 'Full Stack Developer', basic: 42000, hra: 21000, special: 7000, medical: 1250 },
  { id: 11, name: 'Abhinav Karmani',    dept: DEPTS.Engineering, shift: SHIFTS.morning, title: 'Junior Developer',    basic: 28000, hra: 14000, special: 3000, medical: 1250 },
];

// Generate attendance for a user for past N days
function generateAttendanceDays(userId, shiftStart, daysBack = 30) {
  const records = [];
  const now = new Date();

  for (let i = daysBack; i >= 1; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const dayOfWeek = date.getDay();
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dateStr = date.toISOString().split('T')[0];

    // ~15% absent days
    const rand = Math.random();
    if (rand < 0.12) continue; // absent - no record

    // Parse shift start hour
    const [shiftH, shiftM] = shiftStart.split(':').map(Number);

    // Randomize punch in time (on time or late)
    const isLate = rand > 0.75;
    const inHour = isLate ? shiftH + 1 + Math.floor(Math.random() * 2) : shiftH;
    const inMin  = Math.floor(Math.random() * 59);

    const inTime = new Date(date);
    inTime.setHours(inHour, inMin, 0, 0);

    // Punch out ~8-9 hrs later
    const outTime = new Date(inTime);
    outTime.setHours(outTime.getHours() + 8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 59), 0, 0);

    const workedHours = (outTime - inTime) / (1000 * 60 * 60);

    let status = 'Present';
    if (isLate) status = 'Late';
    if (workedHours < 4) status = 'Absent';
    else if (workedHours < 8) status = 'Half Day';

    records.push({ userId, tenantId: TENANT_ID, date: dateStr, inTime, outTime, status, hours: parseFloat(workedHours.toFixed(2)) });
  }
  return records;
}

async function main() {
  console.log('Starting comprehensive test data seed...\n');

  // ─── 1. Add missing designations ───────────────────────────────────────────
  console.log('1. Seeding designations...');
  const company = await p.company.findFirst({ where: { tenantId: TENANT_ID } });
  if (company) {
    const desigTitles = ['HR Executive', 'UI/UX Designer', 'Operations Analyst', 'Backend Developer', 'Product Manager', 'Full Stack Developer', 'Junior Developer'];
    for (const title of desigTitles) {
      const exists = await p.designation.findFirst({ where: { tenantId: TENANT_ID, title } });
      if (!exists) {
        await p.designation.create({ data: { tenantId: TENANT_ID, companyId: company.id, title, grade: 'L1' } });
        console.log(`   Created designation: ${title}`);
      }
    }
  }

  // ─── 2. Update employee profiles with dept, shift, designation ─────────────
  console.log('\n2. Updating employee profiles...');
  for (const emp of EMPLOYEES) {
    const profile = await p.employeeProfile.findUnique({ where: { userId: emp.id } });
    if (profile) {
      await p.employeeProfile.update({
        where: { userId: emp.id },
        data: {
          title: emp.title,
          department: emp.name.includes('HR') ? 'HR' : emp.title.includes('Designer') ? 'Design' : emp.title.includes('Operations') ? 'Operations' : emp.title.includes('Product') ? 'Product' : 'Engineering',
          departmentId: emp.dept,
          shiftId: emp.shift,
          location: 'Delhi Office',
          status: 'Active',
          joiningDate: new Date(2025, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1),
          phone: `98${Math.floor(10000000 + Math.random() * 89999999)}`,
        }
      });
      console.log(`   Updated profile: ${emp.name}`);
    } else {
      // Create profile if missing (user 2 has no profile)
      await p.employeeProfile.create({
        data: {
          userId: emp.id,
          tenantId: TENANT_ID,
          title: emp.title,
          department: 'HR',
          departmentId: emp.dept,
          shiftId: emp.shift,
          location: 'Delhi Office',
          status: 'Active',
          joiningDate: new Date(2025, 2, 15),
          phone: `98${Math.floor(10000000 + Math.random() * 89999999)}`,
        }
      });
      console.log(`   Created profile: ${emp.name}`);
    }
  }

  // ─── 3. Seed salary structures ─────────────────────────────────────────────
  console.log('\n3. Seeding salary structures...');
  for (const emp of EMPLOYEES) {
    const profile = await p.employeeProfile.findUnique({ where: { userId: emp.id } });
    if (!profile) continue;
    const existing = await p.salaryStructure.findUnique({ where: { profileId: profile.id } });
    if (!existing) {
      await p.salaryStructure.create({
        data: {
          profileId: profile.id,
          basic:   emp.basic,
          hra:     emp.hra,
          special: emp.special,
          medical: emp.medical,
          pf:      Math.round(emp.basic * 0.12),
          pt:      200,
          tax:     Math.round(emp.basic * 0.05),
        }
      });
      console.log(`   Salary created: ${emp.name} | CTC: ₹${emp.basic + emp.hra + emp.special + emp.medical}`);
    } else {
      console.log(`   Salary already exists: ${emp.name}`);
    }
  }

  // ─── 4. Seed attendance records (last 30 days) ─────────────────────────────
  console.log('\n4. Seeding attendance records (30 days)...');
  const shiftMap = {
    [SHIFTS.morning]: '09:00',
    [SHIFTS.evening]: '13:00',
    [SHIFTS.night]:   '20:00',
  };

  for (const emp of EMPLOYEES) {
    const shiftStart = shiftMap[emp.shift] || '09:00';
    const records = generateAttendanceDays(emp.id, shiftStart, 30);
    let created = 0;
    for (const rec of records) {
      const exists = await p.attendanceRecord.findUnique({ where: { userId_date: { userId: rec.userId, date: rec.date } } });
      if (!exists) {
        await p.attendanceRecord.create({ data: rec });
        created++;
      }
    }
    console.log(`   ${emp.name}: ${created} attendance records added`);
  }

  // ─── 5. Seed leave applications ────────────────────────────────────────────
  console.log('\n5. Seeding leave applications...');
  const leaveScenarios = [
    { userId: 3,  leaveTypeId: LEAVE_TYPES.SL, startDate: new Date('2026-05-05'), endDate: new Date('2026-05-06'), reason: 'Fever and cold', status: 'APPROVED' },
    { userId: 4,  leaveTypeId: LEAVE_TYPES.CL, startDate: new Date('2026-05-10'), endDate: new Date('2026-05-10'), reason: 'Personal work', status: 'APPROVED' },
    { userId: 6,  leaveTypeId: LEAVE_TYPES.EL, startDate: new Date('2026-05-15'), endDate: new Date('2026-05-17'), reason: 'Family function', status: 'APPROVED' },
    { userId: 10, leaveTypeId: LEAVE_TYPES.CL, startDate: new Date('2026-05-20'), endDate: new Date('2026-05-20'), reason: 'Doctor appointment', status: 'PENDING' },
    { userId: 11, leaveTypeId: LEAVE_TYPES.SL, startDate: new Date('2026-05-19'), endDate: new Date('2026-05-19'), reason: 'Not feeling well', status: 'PENDING' },
    { userId: 2,  leaveTypeId: LEAVE_TYPES.EL, startDate: new Date('2026-06-02'), endDate: new Date('2026-06-06'), reason: 'Annual vacation', status: 'PENDING' },
    { userId: 4,  leaveTypeId: LEAVE_TYPES.SL, startDate: new Date('2026-04-22'), endDate: new Date('2026-04-23'), reason: 'Migraine', status: 'REJECTED' },
    { userId: 9,  leaveTypeId: LEAVE_TYPES.CL, startDate: new Date('2026-05-28'), endDate: new Date('2026-05-28'), reason: 'Personal errand', status: 'PENDING' },
  ];

  for (const leave of leaveScenarios) {
    const exists = await p.leave.findFirst({ where: { userId: leave.userId, startDate: leave.startDate, leaveTypeId: leave.leaveTypeId } });
    if (!exists) {
      await p.leave.create({ data: { ...leave, tenantId: TENANT_ID } });
      console.log(`   Leave created: userId:${leave.userId} | ${leave.status}`);
    }
  }

  // ─── 6. Seed holidays ──────────────────────────────────────────────────────
  console.log('\n6. Seeding holidays...');
  const holidays = [
    { name: 'Independence Day',    date: new Date('2026-08-15'), type: 'NATIONAL' },
    { name: 'Gandhi Jayanti',      date: new Date('2026-10-02'), type: 'NATIONAL' },
    { name: 'Diwali',              date: new Date('2026-10-20'), type: 'FESTIVAL' },
    { name: 'Christmas',           date: new Date('2026-12-25'), type: 'NATIONAL' },
    { name: 'New Year',            date: new Date('2027-01-01'), type: 'NATIONAL' },
    { name: 'Republic Day',        date: new Date('2026-01-26'), type: 'NATIONAL' },
    { name: 'Holi',                date: new Date('2026-03-14'), type: 'FESTIVAL' },
    { name: 'Eid ul-Fitr',         date: new Date('2026-03-31'), type: 'FESTIVAL', isOptional: true },
  ];

  for (const h of holidays) {
    const exists = await p.holiday.findFirst({ where: { tenantId: TENANT_ID, name: h.name } });
    if (!exists) {
      await p.holiday.create({ data: { ...h, tenantId: TENANT_ID } });
      console.log(`   Holiday: ${h.name}`);
    }
  }

  // ─── 7. Seed notifications ─────────────────────────────────────────────────
  console.log('\n7. Seeding notifications...');
  const notifScenarios = [
    { userId: 1,  title: 'Leave Request Pending',    message: 'Shubham Thakur has applied for Casual Leave on May 28.', type: 'leave' },
    { userId: 1,  title: 'Leave Request Pending',    message: 'Shubham Sharma has applied for Casual Leave on May 20.', type: 'leave' },
    { userId: 1,  title: 'Leave Request Pending',    message: 'Abhinav Karmani has applied for Sick Leave on May 19.', type: 'leave' },
    { userId: 1,  title: 'Attendance Alert',         message: 'Raman Thakur was marked late today.', type: 'attendance' },
    { userId: 3,  title: 'Leave Approved',           message: 'Your Sick Leave for May 5-6 has been approved.', type: 'leave' },
    { userId: 10, title: 'Leave Pending Approval',   message: 'Your Casual Leave for May 20 is awaiting approval.', type: 'leave' },
    { userId: 11, title: 'Leave Pending Approval',   message: 'Your Sick Leave for May 19 is awaiting approval.', type: 'leave' },
    { userId: 11, title: 'Attendance Alert',         message: 'You were marked late on May 18. Please regularize if needed.', type: 'attendance' },
  ];

  for (const n of notifScenarios) {
    await p.notification.create({ data: { ...n, tenantId: TENANT_ID } });
  }
  console.log(`   ${notifScenarios.length} notifications created`);

  // ─── 8. Seed bank details ──────────────────────────────────────────────────
  console.log('\n8. Seeding bank details...');
  const bankData = [
    { userId: 2,  bankName: 'HDFC Bank',  accountNumber: '50100123456789', ifsc: 'HDFC0001234' },
    { userId: 3,  bankName: 'ICICI Bank', accountNumber: '123456789012',   ifsc: 'ICIC0001234' },
    { userId: 4,  bankName: 'SBI',        accountNumber: '32145678901234', ifsc: 'SBIN0001234' },
    { userId: 5,  bankName: 'Axis Bank',  accountNumber: '91234567890123', ifsc: 'UTIB0001234' },
    { userId: 6,  bankName: 'HDFC Bank',  accountNumber: '50100987654321', ifsc: 'HDFC0005678' },
    { userId: 9,  bankName: 'Kotak Bank', accountNumber: '1234567890',     ifsc: 'KKBK0001234' },
    { userId: 10, bankName: 'SBI',        accountNumber: '32198765432109', ifsc: 'SBIN0005678' },
    { userId: 11, bankName: 'ICICI Bank', accountNumber: '109876543210',   ifsc: 'ICIC0005678' },
  ];

  for (const b of bankData) {
    const profile = await p.employeeProfile.findUnique({ where: { userId: b.userId } });
    if (!profile) continue;
    const exists = await p.bankDetails.findUnique({ where: { profileId: profile.id } });
    if (!exists) {
      await p.bankDetails.create({ data: { profileId: profile.id, bankName: b.bankName, accountNumber: b.accountNumber, ifsc: b.ifsc } });
      console.log(`   Bank details: userId:${b.userId}`);
    }
  }

  // ─── 9. Seed statutory details ─────────────────────────────────────────────
  console.log('\n9. Seeding statutory details...');
  const statutoryData = [
    { userId: 2,  uan: 'UAN100000001', pfNumber: 'MH/BAN/0001/001', esic: '5100012345001', pan: 'ABCDE1234F', aadhaar: '1234-5678-9012' },
    { userId: 3,  uan: 'UAN100000002', pfNumber: 'MH/BAN/0001/002', esic: '5100012345002', pan: 'BCDEF2345G', aadhaar: '2345-6789-0123' },
    { userId: 4,  uan: 'UAN100000003', pfNumber: 'MH/BAN/0001/003', esic: '5100012345003', pan: 'CDEFG3456H', aadhaar: '3456-7890-1234' },
    { userId: 5,  uan: 'UAN100000004', pfNumber: 'MH/BAN/0001/004', esic: null,            pan: 'DEFGH4567I', aadhaar: '4567-8901-2345' },
    { userId: 6,  uan: 'UAN100000005', pfNumber: 'MH/BAN/0001/005', esic: '5100012345005', pan: 'EFGHI5678J', aadhaar: '5678-9012-3456' },
    { userId: 9,  uan: 'UAN100000006', pfNumber: 'MH/BAN/0001/006', esic: null,            pan: 'FGHIJ6789K', aadhaar: '6789-0123-4567' },
    { userId: 10, uan: 'UAN100000007', pfNumber: 'MH/BAN/0001/007', esic: '5100012345007', pan: 'GHIJK7890L', aadhaar: '7890-1234-5678' },
    { userId: 11, uan: 'UAN100000008', pfNumber: 'MH/BAN/0001/008', esic: '5100012345008', pan: 'HIJKL8901M', aadhaar: '8901-2345-6789' },
  ];

  for (const s of statutoryData) {
    const profile = await p.employeeProfile.findUnique({ where: { userId: s.userId } });
    if (!profile) continue;
    const exists = await p.statutoryDetails.findUnique({ where: { profileId: profile.id } });
    if (!exists) {
      await p.statutoryDetails.create({ data: { profileId: profile.id, uan: s.uan, pfNumber: s.pfNumber, esic: s.esic, pan: s.pan, aadhaar: s.aadhaar } });
      console.log(`   Statutory details: userId:${s.userId}`);
    }
  }

  console.log('\n✅ All test data seeded successfully!');
  console.log('\nSummary:');
  console.log('  - 8 employee profiles updated with dept/shift/designation');
  console.log('  - 8 salary structures created');
  console.log('  - ~30 days attendance per employee');
  console.log('  - 8 leave applications (mix of APPROVED/PENDING/REJECTED)');
  console.log('  - 8 holidays added');
  console.log('  - 8 notifications added');
  console.log('  - 8 bank detail records');
  console.log('  - 8 statutory detail records');
}

main().then(() => p.$disconnect()).catch(e => { console.error('ERROR:', e.message); p.$disconnect(); });
