import dotenv from 'dotenv';
import path from 'path';

// Load .env.test
dotenv.config({ path: path.resolve(__dirname, '../.env.test'), override: true });

console.log('✅ Test Environment Loaded');
console.log('DB URL:', process.env.DATABASE_URL ? 'Loaded' : 'Missing');
