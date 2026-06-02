import { PrismaClient } from '@prisma/client';

const SHULA_DATABASE_URL = "postgres://postgres:fdmabh6f8sy2dvssvhxi@100.75.220.89:1070/shulastudio-db?sslmode=disable";

const prisma = new PrismaClient({
  datasources: { db: { url: SHULA_DATABASE_URL } },
});

async function main() {
    const u = await prisma.user.findUnique({
        where: { id: '8367ade7-fae1-494e-9177-e8634c38c6dd' }
    });
    console.log(JSON.stringify(u, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
