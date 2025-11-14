const { Pool } = require('pg');
require('dotenv').config();

const dbPool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

const testConnection = async () => {
    try {
        await dbPool.connect();
        console.log('Bienvenido a la base de datos Aporta Ya');
        console.log(`Base de datos: ${process.env.DB_NAME}`);
    } catch (error) {
        console.error('Error tratando de conectar con PostgreSQL', error.message);
    }
};

module.exports = {
    dbPool,
    testConnection
};