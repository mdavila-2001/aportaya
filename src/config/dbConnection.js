require('dotenv').config();
const { Pool } = require('pg');

const isLocalDB = 
  process.env.DB_HOST === 'localhost' || 
  process.env.DB_HOST === '127.0.0.1' ||
  process.env.DB_HOST === '::1';

const isCloudDB = !isLocalDB;

const poolConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

if (process.env.DB_SSL === 'true' || isCloudDB) {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
} else if (process.env.DB_SSL === 'false') {
  poolConfig.ssl = false;
} else {
  poolConfig.ssl = isCloudDB ? { rejectUnauthorized: false } : false;
}

const pool = new Pool(poolConfig);

pool.on('connect', (client) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔗 Nueva conexión al pool de PostgreSQL');
  }
});

pool.on('error', (err, client) => {
  console.error('❌ Error inesperado en cliente idle de PostgreSQL:', err);
  process.exit(-1);
});

const testConnection = async () => {
  try {
    const client = await pool.connect();
    
    // Obtener información de la BD
    const result = await client.query('SELECT version(), current_database()');
    const version = result.rows[0].version;
    const database = result.rows[0].current_database;
    
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  ✅ CONEXIÓN EXITOSA A POSTGRESQL                       ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`\n📊 Información de la Base de Datos:`);
    console.log(`   🗄️  Tipo:          ${isLocalDB ? '🏠 Local' : '☁️  Nube (Cloud)'}`);
    console.log(`   🌐 Host:          ${process.env.DB_HOST}`);
    console.log(`   🔢 Puerto:        ${poolConfig.port}`);
    console.log(`   📁 Base de datos: ${database}`);
    console.log(`   👤 Usuario:       ${poolConfig.user}`);
    console.log(`   🔐 SSL:           ${poolConfig.ssl ? '✅ Habilitado' : '❌ Deshabilitado'}`);
    console.log(`   📦 Versión:       ${version.split(',')[0]}`);
    console.log(`\n${'─'.repeat(60)}\n`);
    
    client.release();
    return true;
  } catch (error) {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  ❌ ERROR AL CONECTAR A POSTGRESQL                      ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.error('\n🚨 Detalles del error:');
    console.error(`   Código:  ${error.code || 'N/A'}`);
    console.error(`   Mensaje: ${error.message}`);
    console.log('\n💡 Verifica que:');
    console.log('   1. PostgreSQL esté corriendo (si es local)');
    console.log('   2. Las credenciales en .env sean correctas');
    console.log('   3. El firewall permita la conexión');
    console.log('   4. DB_SSL esté configurado correctamente');
    console.log(`\n${'─'.repeat(60)}\n`);
    return false;
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  testConnection,
  pool,
};
