/**
 * fix-shula-seo.js
 * Repara las etiquetas SEO directamente en la BD de Shula Studio.
 */
import { PrismaClient } from '@prisma/client';

const SHULA_DATABASE_URL = "postgres://postgres:fdmabh6f8sy2dvssvhxi@100.75.220.89:1070/shulastudio-db?sslmode=disable";

const prisma = new PrismaClient({
  datasources: { db: { url: SHULA_DATABASE_URL } },
});

async function main() {
    console.log('🔍 Reparando SEO para Shula Studio...');
    const ORG_ID = 'shula';

    await prisma.landingSetting.update({
        where: { organizationId: ORG_ID },
        data: {
            businessName: 'Shula Studio',
            seoTitle: 'Shula Studio — Reservas en Línea',
            seoDescription: 'Shula Studio: Especialistas en la arquitectura de la mirada. Extensiones de pestañas, diseño de cejas y tratamientos de ultra-lujo en Ciudad de México.',
            seoKeywords: 'pestañas, cejas, microblading, shula studio, cdmx, extensiones de pestañas, lujo',
            slogan: 'Elegancia en cada detalle de tu mirada',
            footerText: '© 2026 Shula Studio. Todos los derechos reservados.'
        }
    });

    console.log('✅ SEO Inyectado correctamente. Limpiando caché...');
    console.log('🚀 ¡Listo! Revisa la página en unos segundos.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
