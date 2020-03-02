const client = require('../client.js');
run();
async function run() {
    try {
        // run a query to create tables
        await client.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(256) NOT NULL,
                hash VARCHAR(512) NOT NULL,
                display_name VARCHAR(256) 
            );
            CREATE TABLE saved (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                name VARCHAR(512) NOT NULL,
                images VARCHAR(512) NOT NULL,
                genre VARCHAR(512) NOT NULL,
                start_date INTEGER NOT NULL,
                tickets_url VARCHAR(512) NOT NULL,
                city VARCHAR(512) NOT NULL,
                state VARCHAR(512) NOT NULL,
                price_min FLOAT,
                price_max FLOAT,
                lat FLOAT,
                long FLOAT
            );
        `);
    }
    catch (err) {
        console.log(err);
    }
    finally {
        // success or failure, need to close the db connection
        client.end();
    }
}