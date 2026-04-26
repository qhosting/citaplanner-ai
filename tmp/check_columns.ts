
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkColumns() {
  try {
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'appointments'
    `;
    console.log('Columns in appointments table:', JSON.stringify(columns, null, 2));
  } catch (e) {
    console.error('Error checking columns:', e);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumns();
