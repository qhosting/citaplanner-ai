
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const records = await prisma.landingSetting.findMany({
        where: { OR: [{ organizationId: 'shula' }, { organizationId: 'shulastudio' }] }
    });
    console.log(JSON.stringify(records, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
