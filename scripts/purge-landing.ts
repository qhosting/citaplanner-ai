import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS landing_settings CASCADE;');
    console.log('✅ Previous landing_settings table purged.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
