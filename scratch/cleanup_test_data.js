const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const TENANT_ID = '1e3be177-ffd4-4ea7-86b5-eb50f1b9d0f5';

// Only the employee user IDs we touched
const EMPLOYEE_IDS = [2, 3, 4, 5, 6, 9, 10, 11];

// Only the notification IDs we added (we'll delete by message pattern)
// Only the leave IDs we added (we'll delete by userId + date)
// Only the holiday names we added
const HOLIDAY_NAMES = [
  'Independence Day', 'Gandhi Jayanti', 'Diwali', 'Christmas',
  'New Year', 'Republic Day', 'Holi', 'Eid ul-Fitr'
];

const DESIGNATION_TITLES = [
  'HR Executive', 'UI/UX Designer', 'Operations Analyst',
  'Backend Developer', 'Product Manager', 'Full Stack Developer', 'Junior Developer'
];

// Attendance dates we added (last 30 days range)
const ATTENDANCE_DATE_FROM = new Date();
ATTENDANCE_DATE_FROM.setDate(ATTENDANCE_DATE_FROM.getDate() - 30);
const DATE_FROM_STR = ATTENDANCE_DATE_FROM.toISOString().split('T')[0];

async function main() {
  console.log('Starting cleanup of seeded test data...\n');

  // 1. Delete notifications we added
  console.log('1. Removing seeded notifications...');
  const delNotifs = await p.notification.deleteMany({
    where: {
      tenantId: TENANT_ID,
      userId: { in: [1, 3, 10, 11] },
      createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } // last 10 min safety window — remove this if running later
    }
  });
  // Fallback: delete by message content
  const delNotifs2 = await p.notification.deleteMany({
    where: {
      tenantId: TENANT_ID,
      message: {
        in: [
          'Shubham Thakur has applied for Casual Leave on May 28.',
          'Shubham Sharma has applied for Casual Leave on May 20.',
          'Abhinav Karmani has applied for Sick Leave on May 19.',
          'Raman Thakur was marked late today.',
          'Your Sick Leave for May 5-6 has been approved.',
          'Your Casual Leave for May 20 is awaiting approval.',
          'Your Sick Leave for May 19 is awaiting approval.',
          'You were marked late on May 18. Please regularize if needed.',
        ]
      }
    }
  });
  console.log(`   Removed ${delNotifs.count + delNotifs2.count} notifications`);

  // 2. Delete seeded leave applications
  console.log('\n2. Removing seeded leave applications...');
  const seedLeaveStartDates = [
    new Date('2026-05-05'), new Date('2026-05-10'), new Date('2026-05-15'),
    new Date('2026-05-20'), new Date('2026-05-19'), new Date('2026-06-02'),
    new Date('2026-04-22'), new Date('2026-05-28'),
  ];
  let leavesDeleted = 0;
  for (const date of seedLeaveStartDates) {
    const del = await p.leave.deleteMany({
      where: { tenantId: TENANT_ID, startDate: date }
    });
    leavesDeleted += del.count;
  }
  console.log(`   Removed ${leavesDeleted} leave records`);

  // 3. Delete seeded attendance records (last 30 days for our employees)
  console.log('\n3. Removing seeded attendance records...');
  const delAtt = await p.attendanceRecord.deleteMany({
    where: {
      tenantId: TENANT_ID,
      userId: { in: EMPLOYEE_IDS },
      date: { gte: DATE_FROM_STR }
    }
  });
  console.log(`   Removed ${delAtt.count} attendance records`);

  // 4. Delete salary structures
  console.log('\n4. Removing salary structures...');
  for (const uid of EMPLOYEE_IDS) {
    const profile = await p.employeeProfile.findUnique({ where: { userId: uid } });
    if (!profile) continue;
    await p.salaryStructure.deleteMany({ where: { profileId: profile.id } });
  }
  console.log(`   Salary structures removed`);

  // 5. Delete bank details we added (only userId:2 was new)
  console.log('\n5. Removing bank details (userId:2)...');
  const profile2 = await p.employeeProfile.findUnique({ where: { userId: 2 } });
  if (profile2) {
    await p.bankDetails.deleteMany({ where: { profileId: profile2.id } });
  }
  console.log(`   Done`);

  // 6. Delete statutory details (only userId:2 was new)
  console.log('\n6. Removing statutory details (userId:2)...');
  if (profile2) {
    await p.statutoryDetails.deleteMany({ where: { profileId: profile2.id } });
  }
  console.log(`   Done`);

  // 7. Delete the profile we created for userId:2 (Raman Thakur — had no profile before)
  console.log('\n7. Removing created profile for userId:2...');
  await p.employeeProfile.deleteMany({ where: { userId: 2 } });
  console.log(`   Done`);

  // 8. Revert updated profiles back to minimal state (remove dept/shift/title we set)
  console.log('\n8. Reverting profile updates for userId: 3,4,5,6,9,10,11...');
  const revertIds = [3, 4, 5, 6, 9, 10, 11];
  for (const uid of revertIds) {
    await p.employeeProfile.updateMany({
      where: { userId: uid },
      data: {
        title: null,
        department: null,
        departmentId: null,
        shiftId: null,
        location: null,
        joiningDate: null,
        phone: null,
      }
    });
  }
  console.log(`   Profiles reverted`);

  // 9. Delete holidays we added
  console.log('\n9. Removing seeded holidays...');
  const delHolidays = await p.holiday.deleteMany({
    where: { tenantId: TENANT_ID, name: { in: HOLIDAY_NAMES } }
  });
  console.log(`   Removed ${delHolidays.count} holidays`);

  // 10. Delete designations we added
  console.log('\n10. Removing seeded designations...');
  const delDesig = await p.designation.deleteMany({
    where: { tenantId: TENANT_ID, title: { in: DESIGNATION_TITLES } }
  });
  console.log(`   Removed ${delDesig.count} designations`);

  console.log('\n✅ Cleanup complete. Database restored to pre-seed state.');
}

main().then(() => p.$disconnect()).catch(e => { console.error('ERROR:', e.message); p.$disconnect(); });
