
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const services = [
    // Lashes
    { name: "Pestañas Mega Volumen Abanico", price: 1250, category: "Lashes", description: "PE-K12" },
    { name: "Pestañas Volumen Ruso Abanico", price: 1050, category: "Lashes", description: "PE-K11" },
    { name: "Pestañas Volumen Americano Abanico", price: 950, category: "Lashes", description: "PE-K10" },
    { name: "Pestañas Volumen Glam 5D Tech", price: 850, category: "Lashes", description: "PE-K09" },
    { name: "Pestañas Volumen 4D Tech", price: 750, category: "Lashes", description: "PE-K08" },
    { name: "Pestañas Volumen Baby 3D Tech", price: 750, category: "Lashes", description: "PE-K07" },
    { name: "Pestañas Hawaianas Volumen y Tech", price: 750, category: "Lashes", description: "PE-K05" },
    { name: "Pestañas Hibridas Volumen + Clasica", price: 700, category: "Lashes", description: "PE-K04" },
    { name: "Pestañas Efecto Mojado Espigas", price: 700, category: "Lashes", description: "PE-K03" },
    { name: "Pestañas Efecto Rímel Natural", price: 650, category: "Lashes", description: "PE-K02" },
    { name: "Pestañas Clásica Natural", price: 600, category: "Lashes", description: "PE-KO01" },
    { name: "Pestañas Lifthing + Tinte", price: 450, category: "Lashes", description: "PE-K13" },
    { name: "Pestañas Lifthing Natural Elevación", price: 350, category: "Lashes", description: "PE-K12" },

    // Brows & Depilación
    { name: "Extensiones de Ceja Una por Una", price: 950, category: "Brows", description: "CE-K" },
    { name: "Henna Brows (Diseño + Depilación + Laminado + Pigmentación)", price: 550, category: "Brows", description: "HE-K02" },
    { name: "Lami Brows (Diseño + Depilación + Laminado)", price: 350, category: "Brows", description: "LA-K01" },
    { name: "Cara Completa con Hilo", price: 350, category: "Depilación", description: "HILO-K" },
    { name: "Cejas Depilación + Diseño de Ceja", price: 250, category: "Brows", description: "CE-K03" },
    { name: "Ceja (Exceso) con Hilo", price: 200, category: "Depilación", description: "CEJA-K010" },
    { name: "Depilación Bigote con Hilo", price: 150, category: "Depilación", description: "HILO-DE" },
    { name: "Depilación Patilla con Hilo", price: 150, category: "Depilación", description: "HILO-K" },

    // Nails
    { name: "Uñas Manicura Spa 1 Tono de Gel", price: 350, category: "Nails", description: "GEL-01" },
    { name: "Uñas Acrílicas Cover + Manicura Express", price: 350, category: "Nails", description: "ACRI-K" },
    { name: "Pedicura Sencilla", price: 350, category: "Nails", description: "PIE-K" },
    { name: "Soft Gel Extensión Completa + Anivelación (Sin Diseño)", price: 300, category: "Nails", description: "SOFT-K" },
    { name: "Soft Gel Extensión Media Sonrisa (Sin Diseño)", price: 300, category: "Nails", description: "SOFT-K" },
    { name: "Uñas Acrílicas Cover (Sin Diseño)", price: 300, category: "Nails", description: "ACRI-K" },
    { name: "Uñas Manicura Rusa 1 Tono de Gel", price: 250, category: "Nails", description: "GEL-00" },
    { name: "Uñas Baño Acrílico (Sin Diseño)", price: 250, category: "Nails", description: "ACRI-K" },
    { name: "Gel Semipermanente + Rubber Anivelación (Sin Diseño)", price: 250, category: "Nails", description: "SEMI-K" },
    { name: "Pies Gel Semipermanente 1 Tono + Pedicura Express", price: 250, category: "Nails", description: "PIES-K" },
    { name: "Uñas Manicura Express", price: 200, category: "Nails", description: "MANI-K" },
    { name: "Pies Gel Semipermanente 1 Tono", price: 200, category: "Nails", description: "PIE-K" },
    { name: "Uñas Gel Semipermanente 3 o 4 Tonos", price: 150, category: "Nails", description: "SEMI-K" },
    { name: "Uñas Gel Semipermanente 1 Tono", price: 120, category: "Nails", description: "SEMI-K01" },
];

async function main() {
    const orgId = 'shulastudio';
    
    // Get tenant id
    const tenant = await prisma.tenant.findUnique({ where: { subdomain: orgId } });
    if (!tenant) {
        console.error("Tenant not found");
        return;
    }

    console.log(`🚀 Seeding ${services.length} services for ${orgId}...`);

    for (const s of services) {
        await prisma.service.create({
            data: {
                name: s.name,
                price: s.price,
                category: s.category,
                description: s.description,
                organizationId: orgId,
                tenantId: tenant.id,
                duration: 60, // Default 1 hour
                status: 'ACTIVE'
            }
        });
    }

    console.log("✅ Seeding complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
