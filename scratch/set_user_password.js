import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Configure who you want to update
const USER_PHONE = "4425060999";
const NEW_PASSWORD = "juanita123"; // You can change this password as needed

async function main() {
    // 1. Find the user in database
    const user = await prisma.user.findFirst({
        where: { phone: USER_PHONE }
    });

    if (!user) {
        console.error(`❌ User not found with phone: ${USER_PHONE}`);
        return;
    }

    console.log(`🔍 Found user: ${user.name} (Role: ${user.role}, Current Password: ${user.password ? 'HASHED' : 'NULL'})`);

    // 2. Hash the new password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(NEW_PASSWORD, salt);

    // 3. Update password in the database
    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
    });

    console.log(`✅ Success! Password updated for ${updatedUser.name}.`);
    console.log(`🔑 You can now log in using:`);
    console.log(`   - Identidad (ID de Acceso): ${USER_PHONE}`);
    console.log(`   - Bóveda (Contraseña): ${NEW_PASSWORD}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
