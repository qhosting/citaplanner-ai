
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- TENANTS ---');
    const tenants = await prisma.tenant.findMany({
        select: { id: true, name: true, subdomain: true, customDomain: true, status: true }
    });
    console.table(tenants);

    console.log('\n--- USERS ---');
    const users = await prisma.user.findMany({
        select: { phone: true, role: true, name: true, email: true, organizationId: true }
    });
    console.table(users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
