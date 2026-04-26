
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function fixSchema() {
  console.log('🚀 Attempting to fix Appointment schema...');
  try {
    // 1. Check if professional_id exists
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'appointments' AND column_name = 'professional_id'
    `;

    if (Array.isArray(columns) && columns.length === 0) {
      console.log('⚠️ Column professional_id missing. Adding it...');
      await prisma.$executeRawUnsafe(`ALTER TABLE "appointments" ADD COLUMN "professional_id" UUID;`);
      console.log('✅ Column professional_id added.');
    } else {
      console.log('ℹ️ Column professional_id already exists.');
    }

    // 2. Check if service_id exists
    const columnsService = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'appointments' AND column_name = 'service_id'
    `;

    if (Array.isArray(columnsService) && columnsService.length === 0) {
      console.log('⚠️ Column service_id missing. Adding it...');
      await prisma.$executeRawUnsafe(`ALTER TABLE "appointments" ADD COLUMN "service_id" UUID;`);
      console.log('✅ Column service_id added.');
    } else {
      console.log('ℹ️ Column service_id already exists.');
    }

    // 3. Check for care_sent
    const colCare = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'appointments' AND column_name = 'care_sent'
    `;
    if (Array.isArray(colCare) && colCare.length === 0) {
      console.log('⚠️ Column care_sent missing. Adding it...');
      await prisma.$executeRawUnsafe(`ALTER TABLE "appointments" ADD COLUMN "care_sent" BOOLEAN DEFAULT false;`);
      console.log('✅ Column care_sent added.');
    } else {
      console.log('ℹ️ Column care_sent already exists.');
    }

    // 4. Check for reminder_sent
    const colRem = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'appointments' AND column_name = 'reminder_sent'
    `;
    if (Array.isArray(colRem) && colRem.length === 0) {
      console.log('⚠️ Column reminder_sent missing. Adding it...');
      await prisma.$executeRawUnsafe(`ALTER TABLE "appointments" ADD COLUMN "reminder_sent" BOOLEAN DEFAULT false;`);
      console.log('✅ Column reminder_sent added.');
    } else {
      console.log('ℹ️ Column reminder_sent already exists.');
    }

    console.log('✨ Schema verification completed.');

  } catch (e) {
    console.error('❌ Error fixing schema:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixSchema();
