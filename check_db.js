import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
    const res = await p.$queryRawUnsafe("SELECT table_name, column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'landing_settings'");
    console.log(JSON.stringify(res, null, 2));
    const data = await p.landingSetting.findMany();
    console.log('--- TABLE DATA ---');
    console.log(JSON.stringify(data, null, 2));
} catch (e) {
    console.error(e);
} finally {
    await p.$disconnect();
}
