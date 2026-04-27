
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const orgId = 'shulastudio';
    const services = await prisma.service.findMany({
        where: { organizationId: orgId },
        select: { id: true, name: true }
    });
    console.log(JSON.stringify(services, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
