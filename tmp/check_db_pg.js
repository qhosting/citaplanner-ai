
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function checkDb() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    await client.connect();
    console.log('Connected to DB');
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'appointments'
    `);
    console.log('Columns:', res.rows.map(r => r.column_name));
  } catch (err) {
    console.error('Connection error', err.stack);
  } finally {
    await client.end();
  }
}

checkDb();
