/**
 * get-tenant-id.js
 * Busca el UUID del tenant 'shula'.
 */
import { PrismaClient } from '@prisma/client';

const SHULA_DATABASE_URL = "postgres://postgres:fdmabh6f8sy2dvssvhxi@100.75.220.89:1070/shulastudio-db?sslmode=disable";

const prisma = new PrismaClient({
  datasources: { db: { url: SHULA_DATABASE_URL } },
});

async function main() {
    const tenant = await prisma.tenant.findUnique({
        where: { subdomain: 'shula' }
    });
    console.log('Tenant Found:', JSON.stringify(tenant, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
