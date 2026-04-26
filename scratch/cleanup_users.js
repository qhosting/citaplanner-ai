
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const godPassword = process.env.GOD_MODE_PASSWORD || 'x0420EZS*';
    const hashedPassword = await bcrypt.hash(godPassword, 10);

    console.log('--- STARTING CLEANUP ---');

    // 1. Delete all users with role GOD_MODE or conflicting phone
    await prisma.user.deleteMany({
        where: {
            OR: [
                { role: 'GOD_MODE' },
                { phone: '4425060999' },
                { phone: 'nexus' }
            ]
        }
    });
    console.log('✅ Previous conflicting users purged.');

    // 2. Create the clean GOD_MODE users
    await prisma.user.create({
        data: {
            name: 'Super Admin Nexus',
            phone: '4425060999',
            email: 'root@aurumcapital.mx',
            password: hashedPassword,
            role: 'GOD_MODE',
            organizationId: 'demo'
        }
    });
    console.log('✅ Created GOD_MODE (4425060999)');

    await prisma.user.create({
        data: {
            name: 'Superintendente Nexus',
            phone: 'nexus',
            email: 'nexus@aurum.ai',
            password: hashedPassword,
            role: 'GOD_MODE',
            organizationId: 'demo'
        }
    });
    console.log('✅ Created GOD_MODE (nexus)');

    console.log('--- CLEANUP FINISHED ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
