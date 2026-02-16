
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const tenantId = 'shulastudio';

    // 1. Ensure Tenant exists (minimal)
    await prisma.tenant.upsert({
        where: { subdomain: tenantId },
        update: { name: 'Shula Studio' },
        create: {
            name: 'Shula Studio',
            subdomain: tenantId,
            organizationId: tenantId
        }
    });

    // 2. Create/Update Landing Settings
    const settings = await prisma.landingSetting.upsert({
        where: { organizationId: tenantId },
        update: {
            businessName: 'Shula Studio',
            primaryColor: '#CE4676', // Bugambilia
            secondaryColor: '#D4AF37', // Gold
            templateId: 'shula_dark',
            slogan: 'El Arte de Resaltar tu Belleza Natural',
            aboutText: 'Santuario de belleza líder en alta tecnología y diseño de autor. En Shula Studio Polanco, fusionamos el arte de la micropigmentación con rituales de cuidado premium para ofrecerte resultados excepcionales y naturales.',
            address: 'Lope de Vega 123, Polanco, Ciudad de México',
            contactPhone: '+52 55 1234 5678',
            whatsappPhone: '+52 55 1234 5678',
            footerText: 'Shula Studio • Miembro Destacado del Ecosistema Aurum • © 2026',
            seoTitle: 'Shula Studio | Micropigmentación y Estética de Lujo en Polanco',
            seoDescription: 'Descubre el estándar de oro en belleza en Shula Studio. Expertos en Lash Lift, Micropigmentación y Cuidado de la Piel en el corazón de Polanco.',
            seoKeywords: 'shula studio, micropigmentacion, polanco, belleza de lujo, lash lift mexico',
            socialInstagram: 'https://instagram.com/shulastudio',
            socialFacebook: 'https://facebook.com/shulastudio',
            features: { ai: true, inventory: true, marketing: true }
        },
        create: {
            organizationId: tenantId,
            businessName: 'Shula Studio',
            primaryColor: '#CE4676', // Bugambilia
            secondaryColor: '#D4AF37', // Gold
            templateId: 'shula_dark',
            slogan: 'El Arte de Resaltar tu Belleza Natural',
            aboutText: 'Santuario de belleza líder en alta tecnología y diseño de autor. En Shula Studio Polanco, fusionamos el arte de la micropigmentación con rituales de cuidado premium para ofrecerte resultados excepcionales y naturales.',
            address: 'Lope de Vega 123, Polanco, Ciudad de México',
            contactPhone: '+52 55 1234 5678',
            whatsappPhone: '+52 55 1234 5678',
            footerText: 'Shula Studio • Miembro Destacado del Ecosistema Aurum • © 2026',
            seoTitle: 'Shula Studio | Micropigmentación y Estética de Lujo en Polanco',
            seoDescription: 'Descubre el estándar de oro en belleza en Shula Studio. Expertos en Lash Lift, Micropigmentación y Cuidado de la Piel en el corazón de Polanco.',
            seoKeywords: 'shula studio, micropigmentacion, polanco, belleza de lujo, lash lift mexico',
            socialInstagram: 'https://instagram.com/shulastudio',
            socialFacebook: 'https://facebook.com/shulastudio',
            features: { ai: true, inventory: true, marketing: true }
        }
    });

    console.log('✅ Template created for Shula Studio:', settings);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
