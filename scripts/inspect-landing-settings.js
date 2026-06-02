import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const s = await prisma.landingSetting.findMany();
    console.log(JSON.stringify(s, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
