const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,                 
        trustServerCertificate: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool;

async function conectarDB() {
    try {
        if (!pool) {
            pool = await new sql.ConnectionPool(config).connect();
            console.log('✅ Pool SQL creado');
        }
        return pool;
    } catch (err) {
        console.error('❌ Error al conectar DB:', err);
        throw err;
    }
}

module.exports = {
    sql,
    conectarDB
};