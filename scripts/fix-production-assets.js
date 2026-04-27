/**
 * fix-production-assets.js
 * Actualiza la BD de Shula Studio con imágenes reales de Unsplash para evitar 404s.
 */
import { PrismaClient } from '@prisma/client';

const SHULA_DATABASE_URL = "postgres://postgres:fdmabh6f8sy2dvssvhxi@100.75.220.89:1070/shulastudio-db?sslmode=disable";

const prisma = new PrismaClient({
  datasources: { db: { url: SHULA_DATABASE_URL } },
});

async function main() {
    console.log('🖼️ Actualizando assets visuales para Shula Studio...');
    const ORG_ID = 'shula';

    // Imágenes de lujo para el carrusel
    const heroSlides = [
        { url: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2000&auto=format&fit=crop", caption: "Diseño de Mirada" },
        { url: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=2000&auto=format&fit=crop", caption: "Cuidado Master" },
        { url: "https://images.unsplash.com/photo-1596704017254-9b121068fb31?q=80&w=2000&auto=format&fit=crop", caption: "Elegancia Pura" }
    ];

    await prisma.landingSetting.update({
        where: { organizationId: ORG_ID },
        data: {
            heroImageUrl: heroSlides[0].url,
            heroSlides: heroSlides,
            // Logo temporal de alta calidad (Dorado)
            logoUrl: "https://i.ibb.co/r7v9t9q/shula-logo-gold.png", 
            aboutText: "Especialistas en la arquitectura de la mirada. Usamos tecnología de punta y productos premium para realzar tu belleza natural con resultados de ultra-lujo.",
            maintenanceMode: false
        }
    });

    console.log('✅ Assets actualizados correctamente.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
