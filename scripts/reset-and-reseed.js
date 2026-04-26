/**
 * reset-and-reseed.js
 * Limpia todos los tenants y crea un setup single-tenant limpio.
 * Plantilla: shulastudio (Luxury Beauty)
 */
import 'dotenv/config';
import prismaClientPkg from '@prisma/client';
const { PrismaClient } = prismaClientPkg;
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('\n🧹 [RESET] Iniciando limpieza de base de datos...\n');

    // ========================================================
    // PASO 1: LIMPIAR TODOS LOS DATOS DEPENDIENTES (orden FK)
    // ========================================================
    console.log('🗑️  Eliminando task_assignments...');
    await prisma.taskAssignment.deleteMany({});

    console.log('🗑️  Eliminando maintenance_tasks...');
    await prisma.maintenanceTask.deleteMany({});

    console.log('🗑️  Eliminando appointments...');
    await prisma.appointment.deleteMany({});

    console.log('🗑️  Eliminando automation_rules...');
    await prisma.automationRule.deleteMany({});

    console.log('🗑️  Eliminando billing_logs...');
    await prisma.billingLog.deleteMany({});

    console.log('🗑️  Eliminando sales...');
    await prisma.sale.deleteMany({});

    console.log('🗑️  Eliminando marketing_campaigns...');
    await prisma.marketingCampaign.deleteMany({});

    console.log('🗑️  Eliminando inventory_movements...');
    await prisma.inventoryMovement.deleteMany({});

    console.log('🗑️  Eliminando subscriptions...');
    await prisma.subscription.deleteMany({});

    console.log('🗑️  Eliminando settings...');
    await prisma.setting.deleteMany({});

    console.log('🗑️  Eliminando users...');
    await prisma.user.deleteMany({});

    console.log('🗑️  Eliminando professionals...');
    await prisma.professional.deleteMany({});

    console.log('🗑️  Eliminando services...');
    await prisma.service.deleteMany({});

    console.log('🗑️  Eliminando products...');
    await prisma.product.deleteMany({});

    console.log('🗑️  Eliminando branches...');
    await prisma.branch.deleteMany({});

    console.log('🗑️  Eliminando clients...');
    await prisma.client.deleteMany({});

    console.log('🗑️  Eliminando leads...');
    await prisma.lead.deleteMany({});

    console.log('🗑️  Eliminando integration_logs...');
    await prisma.integrationLog.deleteMany({});

    console.log('🗑️  Eliminando landing_settings...');
    await prisma.landingSetting.deleteMany({});

    console.log('🗑️  Eliminando transactions...');
    await prisma.transaction.deleteMany({});

    console.log('🗑️  Eliminando tenants...');
    await prisma.tenant.deleteMany({});

    console.log('\n✅ Base de datos limpia.\n');

    // ========================================================
    // PASO 2: CREAR TENANT ÚNICO DEL SISTEMA
    // ========================================================
    const ORG_ID = 'demo'; // Mantenemos 'demo' para compatibilidad con el código actual

    console.log('🏗️  Creando tenant único del sistema...');
    const tenant = await prisma.tenant.create({
        data: {
            name: process.env.BUSINESS_NAME || 'Mi Negocio',
            subdomain: 'demo',
            status: 'ACTIVE',
            planType: 'ELITE',
            organizationId: ORG_ID,
            features: {
                ai_scheduler: true,
                marketing_pro: true,
                inventory_advanced: true,
                analytics_nexus: true
            }
        }
    });
    console.log('✅ Tenant creado:', tenant.id);

    // ========================================================
    // PASO 3: BRANCH PRINCIPAL
    // ========================================================
    console.log('🏗️  Creando sucursal principal...');
    const branch = await prisma.branch.create({
        data: {
            name: 'Sucursal Principal',
            address: '',
            phone: '',
            manager: '',
            status: 'ACTIVE',
            organizationId: ORG_ID,
            tenantId: tenant.id
        }
    });
    console.log('✅ Branch creada:', branch.id);

    // ========================================================
    // PASO 4: LANDING SETTINGS - Plantilla Shula Studio (Luxury)
    // ========================================================
    console.log('🎨 Configurando Landing con plantilla Shula Studio...');
    await prisma.landingSetting.create({
        data: {
            businessName: process.env.BUSINESS_NAME || 'Mi Estudio',
            primaryColor: '#D4AF37',
            secondaryColor: '#09090b',
            templateId: 'shulastudio',
            slogan: 'Donde el arte se encuentra con la elegancia.',
            aboutText: 'Especializados en la arquitectura de la mirada y el cuidado premium de la piel. Cada tratamiento es un ritual de belleza diseñado para potenciar tu identidad.',
            address: '',
            contactPhone: '',
            organizationId: ORG_ID,
            maintenanceMode: false,
            features: {
                ai: true,
                inventory: true,
                marketing: true
            },
            heroSlides: [],
            stats: [
                { label: 'Años de experiencia', value: '5+' },
                { label: 'Clientes satisfechos', value: '500+' },
                { label: 'Especialistas certificados', value: '10+' }
            ],
            testimonials: [],
            images: [],
            services: []
        }
    });
    console.log('✅ Landing Settings creados (template: shulastudio)');

    // ========================================================
    // PASO 5: USUARIOS DEL SISTEMA
    // ========================================================
    console.log('👤 Creando usuario GOD_MODE...');
    const godPhone = process.env.GOD_MODE_PHONE || 'godadmin';
    const godPassword = process.env.GOD_MODE_PASSWORD || 'G0d@dmin2026!';
    await prisma.user.create({
        data: {
            name: process.env.GOD_MODE_NAME || 'Super Admin Nexus',
            phone: godPhone,
            email: process.env.GOD_MODE_EMAIL || 'god@aurum.ai',
            password: bcrypt.hashSync(godPassword, 10),
            role: 'GOD_MODE',
            branchId: branch.id,
            organizationId: ORG_ID,
            preferences: { whatsapp: true, email: true }
        }
    });
    console.log(`✅ GOD_MODE creado → phone: ${godPhone}`);

    // Admin principal del negocio
    const adminPhone = process.env.SEED_ADMIN_PHONE || 'admin';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || '123';
    await prisma.user.create({
        data: {
            name: 'Admin Principal',
            phone: adminPhone,
            email: 'admin@estudio.mx',
            password: bcrypt.hashSync(adminPassword, 10),
            role: 'STUDIO_OWNER',
            branchId: branch.id,
            organizationId: ORG_ID,
            preferences: { whatsapp: true, email: true }
        }
    });
    console.log(`✅ STUDIO_OWNER creado → phone: ${adminPhone}`);

    // QHosting admin si está configurado
    const qhPhone = process.env.QHOSTING_ADMIN_PHONE;
    const qhPassword = process.env.QHOSTING_ADMIN_PASSWORD || 'x0420EZS*';
    if (qhPhone) {
        await prisma.user.create({
            data: {
                name: process.env.QHOSTING_ADMIN_NAME || 'Admin QHosting',
                phone: qhPhone,
                email: process.env.QHOSTING_ADMIN_EMAIL || 'admin@qhosting.net',
                password: bcrypt.hashSync(qhPassword, 10),
                role: 'ADMIN',
                branchId: branch.id,
                organizationId: ORG_ID,
                preferences: { whatsapp: true, email: true }
            }
        });
        console.log(`✅ Admin QHosting creado → phone: ${qhPhone}`);
    }

    // ========================================================
    // PASO 6: PROFESIONAL DEMO
    // ========================================================
    console.log('💅 Creando profesional demo...');
    const defaultSchedule = [
        { dayOfWeek: 1, isEnabled: true, slots: [{ start: '09:00', end: '18:00' }] },
        { dayOfWeek: 2, isEnabled: true, slots: [{ start: '09:00', end: '18:00' }] },
        { dayOfWeek: 3, isEnabled: true, slots: [{ start: '09:00', end: '18:00' }] },
        { dayOfWeek: 4, isEnabled: true, slots: [{ start: '09:00', end: '18:00' }] },
        { dayOfWeek: 5, isEnabled: true, slots: [{ start: '09:00', end: '18:00' }] },
        { dayOfWeek: 6, isEnabled: false, slots: [] },
        { dayOfWeek: 0, isEnabled: false, slots: [] }
    ];

    const professional = await prisma.professional.create({
        data: {
            name: 'Especialista',
            role: 'Estilista',
            email: 'especialista@estudio.mx',
            branchId: branch.id,
            tenantId: tenant.id,
            weeklySchedule: defaultSchedule,
            exceptions: [],
            serviceIds: '',
            organizationId: ORG_ID
        }
    });

    await prisma.user.create({
        data: {
            name: 'Especialista',
            phone: 'pro',
            email: 'especialista@estudio.mx',
            password: bcrypt.hashSync('pro123', 10),
            role: 'PROFESSIONAL',
            relatedId: professional.id,
            branchId: branch.id,
            organizationId: ORG_ID
        }
    });
    console.log(`✅ Profesional demo creado → phone: pro / password: pro123`);

    // ========================================================
    // PASO 7: SERVICIOS DEMO
    // ========================================================
    console.log('✂️  Creando servicios demo...');
    const serviciosDemo = [
        { name: 'Extensión de Pestañas Classic', category: 'PESTAÑAS', price: 550, duration: 90, description: 'Técnica clásica, look natural' },
        { name: 'Extensión de Pestañas Volume', category: 'PESTAÑAS', price: 750, duration: 120, description: 'Máximo volumen y dramatismo' },
        { name: 'Diseño de Cejas', category: 'CEJAS', price: 300, duration: 45, description: 'Armonización y definición' },
        { name: 'Manicure Gel Semipermanente', category: 'UÑAS', price: 350, duration: 60, description: 'Durabilidad de hasta 3 semanas' },
    ];

    for (const svc of serviciosDemo) {
        await prisma.service.create({
            data: {
                ...svc,
                status: 'ACTIVE',
                branchId: branch.id,
                tenantId: tenant.id,
                organizationId: ORG_ID
            }
        });
    }
    console.log(`✅ ${serviciosDemo.length} servicios demo creados`);

    // ========================================================
    // RESUMEN FINAL
    // ========================================================
    console.log('\n🎉 ===================================');
    console.log('   RESET Y SEED COMPLETADOS');
    console.log('=====================================');
    console.log(`\n📌 Tenant único: "${tenant.name}" (subdomain: demo)`);
    console.log(`\n👤 Credenciales:`);
    console.log(`   GOD_MODE   → phone: ${godPhone} | pass: ${godPassword}`);
    console.log(`   STUDIO_OWNER → phone: ${adminPhone} | pass: ${adminPassword}`);
    console.log(`   PROFESSIONAL → phone: pro | pass: pro123`);
    console.log(`\n🎨 Template activo: Shula Studio (Luxury Gold)`);
    console.log(`\n⚠️  Próximo paso: Entra al Web Builder (/web-builder)`);
    console.log(`   y personaliza el nombre, slogan, imágenes y servicios.\n`);
}

main()
    .catch((e) => {
        console.error('\n❌ Error durante el reset:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
