import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // 1. Seed Master Tenant
    const masterTenant = await prisma.tenant.upsert({
        where: { subdomain: 'master' },
        update: { name: 'Aurum Global Nexus' },
        create: {
            name: 'Aurum Global Nexus',
            subdomain: 'master',
            status: 'ACTIVE',
            planType: 'LEGACY',
            organizationId: 'demo',
            features: {
                ai_scheduler: true,
                marketing_pro: true,
                inventory_advanced: true,
                analytics_nexus: true
            }
        }
    });
    console.log('✅ Master Tenant created:', masterTenant.id);

    // 2. Seed Default Branch
    let defaultBranch = await prisma.branch.findFirst({
        where: {
            organizationId: 'demo',
            tenantId: masterTenant.id
        }
    });

    if (!defaultBranch) {
        defaultBranch = await prisma.branch.create({
            data: {
                name: 'Sucursal Central',
                organizationId: 'demo',
                tenantId: masterTenant.id
            }
        });
        console.log('✅ Default Branch created:', defaultBranch.id);
    } else {
        console.log('ℹ️ Default Branch already exists:', defaultBranch.id);
    }

    // 3. Seed Default Landing Settings
    const landingSettings = await prisma.landingSetting.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            businessName: 'CitaPlanner Elite',
            primaryColor: '#630E14',
            secondaryColor: '#C5A028',
            templateId: 'citaplanner',
            slogan: 'Gestión de Lujo Simplificada',
            aboutText: 'Plataforma líder en gestión de citas.',
            address: 'Av. Principal 123, CDMX',
            contactPhone: '+52 55 1234 5678',
            organizationId: 'demo',
            features: {
                ai: true,
                inventory: true,
                marketing: true
            }
        }
    });
    console.log('✅ Landing Settings created/updated');

    // 4. Seed Services
    const existingServices = await prisma.service.count();

    if (existingServices === 0) {
        const servicesToSeed = [
            {
                category: 'PESTAÑAS',
                name: 'TECNICA CLASICA',
                price: 550,
                description: 'NATURAL',
                duration: 90,
                status: 'ACTIVE',
                branchId: defaultBranch.id,
                tenantId: masterTenant.id,
                organizationId: 'demo'
            },
            {
                category: 'UÑAS',
                name: 'GEL SEMIPERMANENTE',
                price: 120,
                description: '1 TONO',
                duration: 45,
                status: 'ACTIVE',
                branchId: defaultBranch.id,
                tenantId: masterTenant.id,
                organizationId: 'demo'
            }
        ];

        for (const service of servicesToSeed) {
            await prisma.service.create({ data: service });
        }
        console.log('✅ Services seeded:', servicesToSeed.length);
    } else {
        console.log('ℹ️ Services already exist, skipping');
    }

    // 5. Seed Users & Professionals
    const existingUsers = await prisma.user.count();

    if (existingUsers === 0) {
        // Create Admin User
        await prisma.user.create({
            data: {
                name: 'Admin Master',
                phone: 'admin',
                email: 'admin@aurum.ai',
                password: bcrypt.hashSync('123', 10),
                role: 'ADMIN',
                branchId: defaultBranch.id,
                organizationId: 'demo',
                preferences: {
                    whatsapp: true,
                    email: true
                }
            }
        });
        console.log('✅ Admin user created (phone: admin, password: 123)');

        // Create Professional
        const defaultSchedule = [
            { dayOfWeek: 1, isEnabled: true, slots: [{ start: "09:00", end: "18:00" }] },
            { dayOfWeek: 2, isEnabled: true, slots: [{ start: "09:00", end: "18:00" }] },
            { dayOfWeek: 3, isEnabled: true, slots: [{ start: "09:00", end: "18:00" }] },
            { dayOfWeek: 4, isEnabled: true, slots: [{ start: "09:00", end: "18:00" }] },
            { dayOfWeek: 5, isEnabled: true, slots: [{ start: "09:00", end: "18:00" }] }
        ];

        const professional = await prisma.professional.create({
            data: {
                name: 'Dra. Ana Elite',
                role: 'Dermatología',
                email: 'ana@aurum.ai',
                branchId: defaultBranch.id,
                tenantId: masterTenant.id,
                weeklySchedule: defaultSchedule,
                exceptions: [],
                serviceIds: '[]',
                organizationId: 'demo'
            }
        });

        // Create Professional User
        await prisma.user.create({
            data: {
                name: 'Dra. Ana Elite',
                phone: 'pro',
                email: 'ana@aurum.ai',
                password: bcrypt.hashSync('pro123', 10),
                role: 'PROFESSIONAL',
                relatedId: professional.id,
                branchId: defaultBranch.id,
                organizationId: 'demo'
            }
        });
        console.log('✅ Professional user created (phone: pro, password: pro123)');
    } else {
        console.log('ℹ️ Users already exist, skipping');
    }

    console.log('🎉 Database seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
