/**
 * check-settings.js
 * Verifica qué hay actualmente en la tabla landing_settings de Shula Studio.
 */
import { PrismaClient } from '@prisma/client';

const SHULA_DATABASE_URL = "postgres://postgres:fdmabh6f8sy2dvssvhxi@100.75.220.89:1070/shulastudio-db?sslmode=disable";

const prisma = new PrismaClient({
  datasources: { db: { url: SHULA_DATABASE_URL } },
});

async function main() {
    console.log('📊 Consultando configuración actual de Landing en Producción...');
    
    const settings = await prisma.landingSetting.findMany();
    
    console.log('Registros encontrados:', settings.length);
    settings.forEach(s => {
        console.log(`- ID: ${s.id} | Org: ${s.organizationId} | Business: ${s.businessName} | Template: ${s.templateId}`);
        console.log(`  SEO Title: ${s.seoTitle}`);
    });

    if (settings.length === 0) {
        console.log('⚠️ No se encontraron registros.');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
