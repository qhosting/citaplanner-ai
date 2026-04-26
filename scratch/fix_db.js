
import 'dotenv/config';
import prismaClientPkg from '@prisma/client';
const { PrismaClient } = prismaClientPkg;

const prisma = new PrismaClient();

async function fix() {
    console.log("🛠️ Attempting to fix database schema...");
    try {
        // Add professional_id if missing
        await prisma.$executeRawUnsafe(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='professional_id') THEN
                    ALTER TABLE appointments ADD COLUMN professional_id UUID;
                    RAISE NOTICE 'Added professional_id to appointments';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='service_id') THEN
                    ALTER TABLE appointments ADD COLUMN service_id UUID;
                    RAISE NOTICE 'Added service_id to appointments';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='reminder_sent') THEN
                    ALTER TABLE appointments ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE;
                    RAISE NOTICE 'Added reminder_sent to appointments';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='care_sent') THEN
                    ALTER TABLE appointments ADD COLUMN care_sent BOOLEAN DEFAULT FALSE;
                    RAISE NOTICE 'Added care_sent to appointments';
                END IF;
            END $$;
        `);

        console.log("✅ Database schema fix attempted.");
    } catch (error) {
        console.error("❌ Error fixing database schema:", error);
    } finally {
        await prisma.$disconnect();
    }
}

fix();
