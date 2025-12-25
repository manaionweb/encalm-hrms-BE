import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking Tenant...');
    const tenant = await prisma.tenant.findUnique({ where: { domain: 'encalmit.com' } });
    if (!tenant) {
        console.error('Tenant not found!');
        return;
    }
    console.log('Tenant ID:', tenant.id);

    console.log('Checking States...');
    const states = await prisma.state.findMany();
    console.log(`Found ${states.length} states.`);
    states.slice(0, 3).forEach(s => console.log(` - ${s.name} (${s.id})`));

    console.log('Checking PT Slabs...');
    const slabs = await prisma.professionalTaxSlab.findMany({ where: { tenantId: tenant.id } });
    console.log(`Found ${slabs.length} PT Slabs.`);
    slabs.forEach(s => console.log(` - ${s.gender} ${s.minSalary}-${s.maxSalary}: ${s.taxAmount} (StateID: ${s.stateId})`));

    if (states.length > 0 && slabs.length === 0) {
        console.log('States exist but Slabs do not. Seeding MH slabs now...');
        const mh = states.find(s => s.name === 'Maharashtra');
        if (mh) {
            await prisma.professionalTaxSlab.createMany({
                data: [
                    { tenantId: tenant.id, stateId: mh.id, gender: 'MALE', minSalary: 0, maxSalary: 7500, taxAmount: 0 },
                    { tenantId: tenant.id, stateId: mh.id, gender: 'MALE', minSalary: 7501, maxSalary: 10000, taxAmount: 175 },
                    { tenantId: tenant.id, stateId: mh.id, gender: 'MALE', minSalary: 10001, maxSalary: 9999999, taxAmount: 200 },
                    { tenantId: tenant.id, stateId: mh.id, gender: 'FEMALE', minSalary: 0, maxSalary: 10000, taxAmount: 0 },
                    { tenantId: tenant.id, stateId: mh.id, gender: 'FEMALE', minSalary: 10001, maxSalary: 9999999, taxAmount: 200 }
                ]
            });
            console.log('Seeded MH Slabs.');
        } else {
            console.error('MH State not found.');
        }
    }
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
