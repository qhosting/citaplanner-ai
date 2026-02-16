import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const subdomain = 'shula';
    const customDomain = 'shulastudio.com';

    console.log(`🚀 Configuring Shula Studio (${subdomain})...`);

    // 1. Ensure Tenant exists
    const tenant = await prisma.tenant.upsert({
        where: { subdomain },
        update: { customDomain },
        create: {
            name: 'Shula Studio Global',
            subdomain,
            customDomain,
            planType: 'ELITE',
            status: 'ACTIVE',
            organizationId: subdomain,
            features: { ai_scheduler: true, marketing_pro: true, inventory_advanced: true, analytics_nexus: true }
        }
    });

    console.log(`✅ Tenant ${tenant.subdomain} ready.`);

    // 2. Set Landing Settings
    const landing = await prisma.landingSetting.upsert({
        where: { organizationId: subdomain },
        update: {
            businessName: 'Shula Studio Global',
            primaryColor: '#D4AF37',
            secondaryColor: '#000000',
            templateId: 'beauty',
            slogan: 'Elegancia en cada detalle de tu mirada',
            aboutText: 'En Shula Studio, transformamos la belleza en una experiencia de lujo. Expertos en extensiones de pestañas y diseño de cejas con los más altos estándares de calidad.',
            address: 'Polanco, Ciudad de México',
            contactPhone: '+52 55 1234 5678',
            heroImageUrl: 'https://images.unsplash.com/photo-1522335718011-7f3bc8fba899'
        },
        create: {
            organizationId: subdomain,
            businessName: 'Shula Studio Global',
            primaryColor: '#D4AF37',
            secondaryColor: '#000000',
            templateId: 'beauty',
            slogan: 'Elegancia en cada detalle de tu mirada',
            aboutText: 'En Shula Studio, transformamos la belleza en una experiencia de lujo. Expertos en extensiones de pestañas y diseño de cejas con los más altos estándares de calidad.',
            address: 'Polanco, Ciudad de México',
            contactPhone: '+52 55 1234 5678',
            heroImageUrl: 'https://images.unsplash.com/photo-1522335718011-7f3bc8fba899'
        }
    });

    console.log(`✅ Landing settings for Shula configured.`);

    // 3. Ensure Default Services
    const services = [
        { name: 'Extensiones de Pestañas Classic', price: 850, duration: 90, category: 'PESTAÑAS' },
        { name: 'Microblading Máster', price: 3500, duration: 180, category: 'CEJAS' },
        { name: 'Lifting de Pestañas Premium', price: 650, duration: 60, category: 'PESTAÑAS' }
    ];

    for (const s of services) {
        await prisma.service.upsert({
            where: { id: '00000000-0000-0000-0000-000000000000' }, // Dummy to trigger create if not found by name
            update: {},
            create: {
                ...s,
                organizationId: subdomain,
                tenantId: tenant.id,
                status: 'ACTIVE',
                description: 'Protocolo de alta gama para resultados naturales.'
            }
        }).catch(() => {
            // If upsert fails due to missing unique key on name, just create
            return prisma.service.create({
                data: {
                    ...s,
                    organizationId: subdomain,
                    tenantId: tenant.id,
                    status: 'ACTIVE',
                    description: 'Protocolo de alta gama para resultados naturales.'
                }
            });
        });
    }

    console.log(`✅ Shula Studio services provisioned.`);
    console.log(`✨ Configuration Complete. Visit https://${customDomain} to see results.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
