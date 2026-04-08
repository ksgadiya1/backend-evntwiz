const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: dbUrl,
});

const initDb = async () => {
  const dbName = dbUrl.split('/').pop().split('?')[0];
  const baseUrl = dbUrl.substring(0, dbUrl.lastIndexOf('/'));
  const postgresUrl = `${baseUrl}/postgres`;

  // 1. Connect to 'postgres' default database to check/create the target database
  const tempPool = new Pool({ connectionString: postgresUrl });
  try {
    const client = await tempPool.connect();
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (res.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating it...`);
      // Note: CREATE DATABASE cannot be run with parameters for the name
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully.`);
    }
    client.release();
  } catch (err) {
    console.error('Error creating database:', err.message);
  } finally {
    await tempPool.end();
  }

  // 2. Now run the schema on the target database
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schemaSql);
    console.log('Database schema initialized (tables created or already exist).');
  } catch (err) {
    console.error('Error initializing database schema:', err.message);
  }
};

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initDb,
};
