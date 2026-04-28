import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const DB_NAME = process.env.DB_NAME || 'goldsense_pro';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASSWORD || 'Hitansh2005@';
const DB_HOST = process.env.DB_HOST || 'localhost';

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  dialect: 'mysql',
  logging: false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
});

export async function initializeDatabase(): Promise<void> {
  try {
    // Connect without DB to create it if it doesn't exist
    const tempSeq = new Sequelize('', DB_USER, DB_PASS, {
      host: DB_HOST,
      dialect: 'mysql',
      logging: false,
    });
    await tempSeq.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    await tempSeq.close();

    // Now connect to the actual DB
    await sequelize.authenticate();
    console.log('✅ MySQL connected successfully');

    // IMPORTANT: Import ALL models before sync so Sequelize knows about them
    await import('../models/Trade.js');
    await import('../models/Position.js');
    await import('../models/PriceAlert.js');
    console.log('📦 Models loaded: Trade, Position, PriceAlert');

    // Sync all models — try alter first, fall back to force if schema mismatch
    try {
      await sequelize.sync({ alter: true });
      console.log('✅ Database tables synced (alter mode)');
    } catch (syncErr: any) {
      console.warn('⚠️  alter sync failed, trying force sync...', syncErr.message);
      await sequelize.sync({ force: true });
      console.log('✅ Database tables synced (force mode — tables recreated)');
    }
  } catch (error: any) {
    console.error('❌ MySQL connection failed:', error.message);
    console.error('   Full error:', error);
    console.warn('⚠️  Server will continue without database. Trade history will not be persisted.');
  }
}
