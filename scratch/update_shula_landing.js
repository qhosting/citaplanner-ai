
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const orgId = 'shulastudio';
    
    const targetNames = [
        "Pestañas Mega Volumen Abanico",
        "Pestañas Volumen Ruso Abanico",
        "Henna Brows (Diseño + Depilación + Laminado + Pigmentación)",
        "Lami Brows (Diseño + Depilación + Laminado)",
        "Uñas Acrílicas Cover + Manicura Express",
        "Soft Gel Extensión Completa + Anivelación (Sin Diseño)"
    ];

    const services = await prisma.service.findMany({
        where: {
            organizationId: orgId,
            name: { in: targetNames }
        },
        select: { id: true }
    });

    const serviceIds = services.map(s => s.id);

    console.log(`🎯 Found ${serviceIds.length} services to highlight.`);

    await prisma.landingSetting.update({
        where: { organizationId: orgId },
        data: {
            serviceIds: serviceIds // This might need to be cast to Json if Prisma complains, but usually it works if field is Json
        }
    });

    console.log("✅ Landing Settings updated with highlighted services.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
