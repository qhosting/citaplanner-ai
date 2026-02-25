import { PrismaClient } from '@prisma/client';
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function cleanup() {
    console.log('🚀 Starting deep cleanup...');

    // 1. Fix .env file (remove trailing whitespace/CR)
    try {
        const envPath = '.env';
        if (fs.existsSync(envPath)) {
            let content = fs.readFileSync(envPath, 'utf-8');
            const lines = content.split('\n').map(line => {
                if (line.includes('GOD_MODE_PASSWORD')) {
                    const parts = line.split('=');
                    return `${parts[0]}=${parts[1].trim()}`;
                }
                return line;
            });
            fs.writeFileSync(envPath, lines.join('\n'));
            console.log('✅ .env cleaned (GOD_MODE_PASSWORD trimmed)');
        }
    } catch (e) {
        console.error('❌ Error cleaning .env:', e);
    }

    // 2. Fix landing_settings table
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();

        console.log('🔄 Reconfiguring landing_settings table...');

        // Drop and recreate is safest given the Int vs UUID mess
        await client.query('DROP TABLE IF EXISTS landing_settings CASCADE');

        await client.query(`
            CREATE TABLE landing_settings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                business_name VARCHAR(100) DEFAULT 'CitaPlanner Elite',
                primary_color VARCHAR(20) DEFAULT '#630E14',
                secondary_color VARCHAR(20) DEFAULT '#C5A028',
                template_id VARCHAR(20) DEFAULT 'citaplanner',
                slogan TEXT,
                about_text TEXT,
                address TEXT,
                contact_phone VARCHAR(20),
                hero_image_url TEXT,
                logo_url TEXT,
                organization_id VARCHAR(50) UNIQUE DEFAULT 'demo',
                seo_title VARCHAR(100),
                seo_description TEXT,
                seo_keywords TEXT,
                latitude DOUBLE PRECISION,
                longitude DOUBLE PRECISION,
                whatsapp_phone VARCHAR(20),
                footer_text TEXT,
                social_instagram VARCHAR(255),
                social_facebook VARCHAR(255),
                social_twitter VARCHAR(255),
                features JSONB DEFAULT '{"ai": true, "inventory": true, "marketing": true}'
            )
        `);
        console.log('✅ landing_settings table recreated with UUID support');

        // 3. Clean up any GOD_MODE users that might have bad passwords
        const godPhone = process.env.GOD_MODE_PHONE;
        if (godPhone) {
            console.log(`🧹 Removing existing GOD_MODE users for ${godPhone} to force clean seed...`);
            await client.query('DELETE FROM users WHERE phone = $1', [godPhone]);
            console.log('✅ Old GOD_MODE records cleared');
        }

    } catch (e) {
        console.error('❌ Database migration error:', e);
    } finally {
        await client.end();
    }
}

cleanup();
