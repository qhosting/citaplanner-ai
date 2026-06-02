import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const u = await prisma.user.findUnique({
        where: { id: '8367ade7-fae1-494e-9177-e8634c38c6dd' }
    });
    console.log(JSON.stringify(u, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
