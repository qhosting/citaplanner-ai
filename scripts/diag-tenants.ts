import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const tenants = await prisma.tenant.findMany();
    console.log('--- GLOBAL TENANT LIST (DATABASE) ---');
    console.log(JSON.stringify(tenants, null, 2));
    console.log('--- TOTAL TENANTS:', tenants.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());
