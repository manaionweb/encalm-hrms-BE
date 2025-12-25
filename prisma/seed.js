const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    // 1. Create Tenant
    const tenant = await prisma.tenant.create({
        data: {
            name: 'Encalm Consultancy (Demo)',
            domain: 'encalm-demo',
            plan: 'ENTERPRISE'
        }
    });

    // 2. Create Roles
    const adminRole = await prisma.role.create({
        data: {
            name: 'ADMIN',
            permissions: JSON.stringify(['ALL_ACCESS']),
            tenantId: tenant.id
        }
    });

    const employeeRole = await prisma.role.create({
        data: {
            name: 'EMPLOYEE',
            permissions: JSON.stringify(['VIEW_OWN_DATA', 'APPLY_LEAVE']),
            tenantId: tenant.id
        }
    });

    // 3. Create Manager (User)
    const manager = await prisma.user.create({
        data: {
            email: 'manager@encalm.com',
            name: 'Manager Singh',
            tenantId: tenant.id,
            roleId: adminRole.id
        }
    });

    // 4. Create Employee (User)
    const employee = await prisma.user.create({
        data: {
            email: 'employee@encalm.com',
            name: 'Raman Thakur',
            tenantId: tenant.id,
            roleId: employeeRole.id,
            managerId: manager.id, // Hierarchy
            leaves: {
                create: [
                    {
                        type: 'PL',
                        reason: 'Vacation',
                        startDate: new Date('2025-12-25'),
                        endDate: new Date('2025-12-30'),
                        status: 'APPROVED',
                        tenantId: tenant.id
                    },
                    {
                        type: 'SL',
                        reason: 'Fever',
                        startDate: new Date('2026-01-10'),
                        endDate: new Date('2026-01-11'),
                        status: 'PENDING',
                        tenantId: tenant.id
                    },
                ],
            },
        },
    });

    console.log({ tenant, manager, employee });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
