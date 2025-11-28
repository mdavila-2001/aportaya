const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const dbPool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function testDatabaseConnection() {
    try {
        console.log('DB_NAME:', process.env.DB_NAME);
        console.log('=== Iniciando prueba de conexión ===\n');
        
        
        const client = await dbPool.connect();
        console.log('✓ Conexión establecida exitosamente\n');
        
        
        const dbInfo = await client.query('SELECT current_database() AS database, current_user AS user');
        console.log('Base de datos actual:', dbInfo.rows[0].database);
        console.log('Usuario conectado:', dbInfo.rows[0].user);
        console.log('\n');
        
        
        const schemasResult = await client.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
            ORDER BY schema_name
        `);
        console.log('=== Esquemas disponibles ===');
        if (schemasResult.rows.length === 0) {
            console.log('⚠️  NO HAY ESQUEMAS PERSONALIZADOS CREADOS');
        } else {
            schemasResult.rows.forEach(row => {
                console.log(`  - ${row.schema_name}`);
            });
        }
        console.log('\n');
        
        
        const permissionsResult = await client.query(`
            SELECT grantee, privilege_type
            FROM information_schema.role_table_grants
            WHERE grantee = current_user
        `);
        console.log('=== Permisos del usuario conectado ===');
        if (permissionsResult.rows.length === 0) {
            console.log('⚠️  El usuario no tiene permisos sobre ninguna tabla');
        } else {
            permissionsResult.rows.forEach(row => {
                
            });
        }
        console.log('\n');
        
        client.release();
        console.log('=== Prueba completada ===');
        
    } catch (error) {
        console.error('\n❌ Error durante la prueba:');
        console.error('Mensaje:', error.message);
        console.error('Código:', error.code);
        console.error('\nDetalles completos:', error);
    } finally {
        await dbPool.end();
    }
}

testDatabaseConnection();
