
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const schemaPath = path.join(__dirname, '../backend/src/models/schema.sql');

async function initDB() {
  console.log('Starting Database Initialization...');
  
  // Connect without database first to create it
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true
  });

  try {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('Applying schema...');
    await connection.query(schema);
    console.log('Database and Tables created successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await connection.end();
  }
}

initDB();
