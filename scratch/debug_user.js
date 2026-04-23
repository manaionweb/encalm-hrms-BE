const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { email: 'employee@encalm.com' },
        include: { 
            role: true,
            attendanceRecords: {
                orderBy: { date: 'desc' },
                take: 5
            },
            leaves: {
                include: { leaveType: true }
            }
        }
    });

    console.log('--- USER INFO ---');
    console.log(JSON.stringify(user, null, 2));

    const leaveTypes = await prisma.leaveType.findMany({
        where: { tenantId: user.tenantId }
    });
    console.log('\n--- LEAVE TYPES ---');
    console.log(JSON.stringify(leaveTypes, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
