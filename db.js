const { Pool } = require('pg');

const pool = new Pool({
    user: 'minaguevara',
    host: 'localhost',
    database: 'ecommerce_app',
    password: 'password',
    port: 5432,
});

module.exports = {
    query: (text, params, callback) => {
    return pool.query(text, params, callback);
    },
};
