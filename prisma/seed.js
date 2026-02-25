import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding on remote database...');

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
    console.log('✅ Master Tenant created/verified:', masterTenant.id);

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

    if (existingUsers < 2) { // Allow more seeding if only some users exist
        // Create Admin User
        const adminPhone = process.env.SEED_ADMIN_PHONE || 'admin';
        const existingAdmin = await prisma.user.findFirst({ where: { phone: adminPhone, organizationId: 'demo' } });

        if (!existingAdmin) {
            await prisma.user.create({
                data: {
                    name: 'Admin Master',
                    phone: adminPhone,
                    email: 'admin@aurum.ai',
                    password: bcrypt.hashSync(process.env.SEED_ADMIN_PASSWORD || '123', 10),
                    role: 'ADMIN',
                    branchId: defaultBranch.id,
                    organizationId: 'demo',
                    preferences: {
                        whatsapp: true,
                        email: true
                    }
                }
            });
            console.log(`✅ Admin user created (phone: ${adminPhone})`);
        }

        // Create Professional
        let professional = await prisma.professional.findFirst({
            where: { email: 'ana@aurum.ai', organizationId: 'demo' }
        });

        if (!professional) {
            const defaultSchedule = [
                { dayOfWeek: 1, isEnabled: true, slots: [{ start: "09:00", end: "18:00" }] },
                { dayOfWeek: 2, isEnabled: true, slots: [{ start: "09:00", end: "18:00" }] },
                { dayOfWeek: 3, isEnabled: true, slots: [{ start: "09:00", end: "18:00" }] },
                { dayOfWeek: 4, isEnabled: true, slots: [{ start: "09:00", end: "18:00" }] },
                { dayOfWeek: 5, isEnabled: true, slots: [{ start: "09:00", end: "18:00" }] }
            ];

            professional = await prisma.professional.create({
                data: {
                    name: 'Dra. Ana Elite',
                    role: 'Dermatología',
                    email: 'ana@aurum.ai',
                    branchId: defaultBranch.id,
                    tenantId: masterTenant.id,
                    weekly_schedule: defaultSchedule,
                    exceptions: [],
                    service_ids: '[]',
                    organizationId: 'demo'
                }
            });
            console.log('✅ Professional created:', professional.id);
        }

        // Create Professional User
        const existingPro = await prisma.user.findFirst({ where: { phone: 'pro', organizationId: 'demo' } });
        if (!existingPro) {
            await prisma.user.create({
                data: {
                    name: 'Dra. Ana Elite',
                    phone: 'pro',
                    email: 'ana@aurum.ai',
                    password: bcrypt.hashSync('pro123', 10),
                    role: 'PROFESSIONAL',
                    related_id: professional.id,
                    branchId: defaultBranch.id,
                    organizationId: 'demo'
                }
            });
            console.log('✅ Professional user created (phone: pro, password: pro123)');
        }
    } else {
        console.log('ℹ️ System users already exist, skipping default user creation');
    }

    // 6. Seed Special QHosting Admin
    const qhostingAdminPhone = process.env.QHOSTING_ADMIN_PHONE;

    if (qhostingAdminPhone) {
        const existingQAdmin = await prisma.user.findFirst({
            where: {
                phone: qhostingAdminPhone,
                organizationId: 'demo'
            }
        });

        if (!existingQAdmin) {
            await prisma.user.create({
                data: {
                    name: process.env.QHOSTING_ADMIN_NAME || 'Admin QHosting',
                    phone: qhostingAdminPhone,
                    email: process.env.QHOSTING_ADMIN_EMAIL || 'admin@qhosting.net',
                    password: bcrypt.hashSync(process.env.QHOSTING_ADMIN_PASSWORD || 'x0420EZS*', 10),
                    role: 'ADMIN',
                    branchId: defaultBranch.id,
                    organizationId: 'demo',
                    preferences: {
                        whatsapp: true,
                        email: true
                    }
                }
            });
            console.log(`✅ QHosting Admin user created (phone: ${qhostingAdminPhone})`);
        } else {
            console.log('ℹ️ QHosting Admin user already exists');
        }
    }

    // 7. Seed GOD_MODE Super Admin
    const godPhone = process.env.GOD_MODE_PHONE || 'godadmin';
    const existingGodMode = await prisma.user.findFirst({
        where: {
            OR: [
                { role: 'GOD_MODE' },
                { phone: godPhone }
            ]
        }
    });

    if (!existingGodMode) {
        const godPassword = process.env.GOD_MODE_PASSWORD || 'G0d@dmin2026!';
        const godName = process.env.GOD_MODE_NAME || 'Super Admin Nexus';
        const godEmail = process.env.GOD_MODE_EMAIL || 'god@aurum.ai';

        await prisma.user.create({
            data: {
                name: godName,
                phone: godPhone,
                email: godEmail,
                password: bcrypt.hashSync(godPassword, 10),
                role: 'GOD_MODE',
                branchId: defaultBranch.id,
                organizationId: 'demo',
                preferences: {
                    whatsapp: true,
                    email: true
                }
            }
        });
        console.log(`✅ GOD_MODE Super Admin created (phone: ${godPhone})`);
    } else {
        console.log('ℹ️ GOD_MODE Super Admin already exists:', existingGodMode.phone);
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
