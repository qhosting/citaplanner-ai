
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const landing = await prisma.landingSetting.findUnique({
        where: { organizationId: 'shulastudio' }
    });
    console.log(JSON.stringify(landing, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
