/**
 * add-volumen-service.js
 * Agrega el servicio 'Montaje de Volumen' a la base de datos de Shula Studio.
 */
import { PrismaClient } from '@prisma/client';

const SHULA_DATABASE_URL = "postgres://postgres:fdmabh6f8sy2dvssvhxi@100.75.220.89:1070/shulastudio-db?sslmode=disable";

const prisma = new PrismaClient({
  datasources: { db: { url: SHULA_DATABASE_URL } },
});

async function main() {
    console.log('✨ Agregando "Montaje de Volumen" a Shula Studio...');
    const ORG_ID = 'shula';
    const TENANT_UUID = '0f7a1bf8-77b4-4238-8a22-5bff4016fb4c';

    // 1. Crear el servicio real
    const newService = await prisma.service.create({
        data: {
            name: 'Montaje de Volumen',
            description: 'Técnica avanzada para crear una mirada intensa y voluminosa. Ideal para quienes buscan un efecto glamuroso y duradero.',
            price: 1850,
            duration: 150, // 2.5 horas
            category: 'Pestañas',
            status: 'ACTIVE',
            tenantId: TENANT_UUID,
            organizationId: ORG_ID,
            imageUrl: 'https://images.unsplash.com/photo-1583001931096-759c39c0605b?q=80&w=1000&auto=format&fit=crop'
        }
    });

    console.log(`✅ Servicio creado con ID: ${newService.id}`);

    // 2. Actualizar LandingSettings para incluir este nuevo ID en los destacados
    const settings = await prisma.landingSetting.findUnique({ where: { organizationId: ORG_ID } });
    
    // El campo serviceIds en Professional es un string, pero en LandingSettings no veo serviceIds en el schema.
    // Revisando el schema de landing_settings...
    // model LandingSetting { ... services Json? @default("[]") ... }
    
    // Ah, LandingSettings usa un campo 'services' que es un JSON.
    // Vamos a actualizar ese JSON.
    
    const currentServices = settings?.services || [];
    const updatedServices = [...currentServices, {
        id: newService.id,
        name: newService.name,
        price: newService.price,
        description: newService.description,
        category: newService.category,
        imageUrl: newService.imageUrl
    }];

    await prisma.landingSetting.update({
        where: { organizationId: ORG_ID },
        data: {
            services: updatedServices
        }
    });

    console.log('🚀 ¡Listo! El servicio ya es visible en la web.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
