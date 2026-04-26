
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const tenants = await prisma.tenant.findMany({
        select: { subdomain: true, name: true, status: true }
    });
    const users = await prisma.user.findMany({
        select: { phone: true, role: true, name: true, email: true }
    });
    
    console.log('--- TENANTS ---');
    console.table(tenants);
    console.log('\n--- USERS ---');
    console.table(users);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
