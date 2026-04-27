
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const subdomain = 'shulastudio';
    const customDomain = 'shulastudio.mx';
    const name = 'Shula Studio MX';
    const adminPhone = '4271385455';
    const adminPassword = 'Shula24*';

    console.log(`🚀 Provisioning tenant: ${subdomain}...`);

    // 1. Create Tenant
    const tenant = await prisma.tenant.upsert({
        where: { subdomain },
        update: {
            name,
            customDomain,
            status: 'ACTIVE'
        },
        create: {
            name,
            subdomain,
            customDomain,
            status: 'ACTIVE',
            organizationId: subdomain,
            planType: 'PRO',
            features: {
                ai_scheduler: true,
                marketing_pro: true,
                inventory_advanced: true,
                analytics_nexus: true,
                ai_automation: true
            }
        }
    });

    console.log(`✅ Tenant created: ${tenant.id}`);

    // 2. Create Branch
    let branch = await prisma.branch.findFirst({
        where: { organizationId: subdomain, name: 'Sucursal Principal' }
    });

    if (!branch) {
        branch = await prisma.branch.create({
            data: {
                name: 'Sucursal Principal',
                tenantId: tenant.id,
                organizationId: subdomain,
                status: 'ACTIVE'
            }
        });
    }

    console.log(`✅ Branch created: ${branch.id}`);

    // 3. Create Admin User
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const user = await prisma.user.upsert({
        where: {
            phone_organizationId: {
                phone: adminPhone,
                organizationId: subdomain
            }
        },
        update: {
            name: 'Admin Shula MX',
            password: hashedPassword,
            role: 'STUDIO_OWNER',
            branchId: branch.id
        },
        create: {
            name: 'Admin Shula MX',
            phone: adminPhone,
            email: 'contacto@shulastudio.mx',
            password: hashedPassword,
            role: 'STUDIO_OWNER',
            organizationId: subdomain,
            branchId: branch.id
        }
    });

    console.log(`✅ Admin User created: ${user.name} (${user.phone})`);
    
    // 4. Create Landing Settings (Safe)
    const existingLanding = await prisma.landingSetting.findUnique({ where: { organizationId: subdomain } });
    if (!existingLanding) {
        await prisma.landingSetting.create({
            data: {
                organizationId: subdomain,
                businessName: name,
                templateId: 'shula_dark',
                primaryColor: '#D4AF37',
                secondaryColor: '#000000',
                slogan: 'Elegancia en cada detalle',
                aboutText: 'Expertos en belleza y cuidado personal.',
                heroImageUrl: 'https://images.unsplash.com/photo-1522335718011-7f3bc8fba899'
            }
        });
        console.log('✅ Landing Settings initialized (New).');
    } else {
        console.log('ℹ️ Landing Settings already exist. Skipping initialization to preserve user changes.');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
