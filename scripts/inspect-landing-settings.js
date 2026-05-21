import { PrismaClient } from '@prisma/client';

const SHULA_DATABASE_URL = "postgres://postgres:fdmabh6f8sy2dvssvhxi@100.75.220.89:1070/shulastudio-db?sslmode=disable";

const prisma = new PrismaClient({
  datasources: { db: { url: SHULA_DATABASE_URL } },
});

async function main() {
    const s = await prisma.landingSetting.findFirst({
        where: { templateId: 'shulastudio' }
    });
    console.log(JSON.stringify(s, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
