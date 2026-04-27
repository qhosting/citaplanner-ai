/**
 * inject-shula.js
 * Inyecta los datos iniciales directamente en la base de datos remota de Shula Studio.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// URL de la base de datos de Shula Studio proporcionada por el usuario
const SHULA_DATABASE_URL = "postgres://postgres:fdmabh6f8sy2dvssvhxi@100.75.220.89:1070/shulastudio-db?sslmode=disable";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: SHULA_DATABASE_URL,
    },
  },
});

async function main() {
    console.log('🚀 Iniciando inyección de datos en SHULA STUDIO...');
    const ORG_ID = 'shula';

    // 1. Crear Tenant
    console.log('🏗️  Creando tenant...');
    const tenant = await prisma.tenant.upsert({
        where: { subdomain: ORG_ID },
        update: { name: 'Shula Studio' },
        create: {
            name: 'Shula Studio',
            subdomain: ORG_ID,
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
    console.log('✅ Tenant verificado:', tenant.id);

    // 2. Crear Branch
    console.log('🏗️  Creando sucursal...');
    const branch = await prisma.branch.upsert({
        where: { id: '5d248898-04c9-44f4-bcf6-62dacccdfbb1' }, // ID fijo para consistencia
        update: { name: 'Sucursal Central Shula' },
        create: {
            id: '5d248898-04c9-44f4-bcf6-62dacccdfbb1',
            name: 'Sucursal Central Shula',
            status: 'ACTIVE',
            organizationId: ORG_ID,
            tenantId: tenant.id
        }
    });
    console.log('✅ Branch verificada:', branch.id);

    // 3. Crear Usuario GOD_MODE
    console.log('👤 Inyectando usuario GOD_MODE...');
    const godPhone = "4425060999";
    const godPassword = "x0420EZS*";
    
    await prisma.user.upsert({
        where: { 
            phone_organizationId: {
                phone: godPhone,
                organizationId: ORG_ID
            }
        },
        update: { role: 'GOD_MODE' },
        create: {
            name: 'Super Admin Nexus',
            phone: godPhone,
            email: 'root@aurumcapital.mx',
            password: bcrypt.hashSync(godPassword, 10),
            role: 'GOD_MODE',
            branchId: branch.id,
            organizationId: ORG_ID
        }
    });
    console.log(`✅ Usuario GOD_MODE listo (${godPhone})`);

    // 4. Crear Landing Settings (Shula Template)
    console.log('🎨 Configurando Landing Page...');
    await prisma.landingSetting.upsert({
        where: { organizationId: ORG_ID },
        update: { templateId: 'shulastudio', businessName: 'Shula Studio' },
        create: {
            businessName: 'Shula Studio',
            primaryColor: '#D4AF37',
            secondaryColor: '#09090b',
            templateId: 'shulastudio',
            slogan: 'Donde el arte se encuentra con la elegancia.',
            aboutText: 'Especializados en la arquitectura de la mirada.',
            organizationId: ORG_ID,
            features: { ai: true, inventory: true, marketing: true }
        }
    });
    console.log('✅ Landing Page configurada.');

    console.log('\n🎉 INYECCIÓN COMPLETADA EXITOSAMENTE EN SHULASTUDIO.MX');
}

main()
    .catch((e) => {
        console.error('❌ Error durante la inyección:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
