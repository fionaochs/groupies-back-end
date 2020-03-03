

const client = require('../client.js');
// import our seed data:
const saved = require('./saved.js');
run();
async function run() {
    try {
        // await client.connect();
        await client.query(`
            INSERT INTO users (email, hash, display_name, city_name, lat, long)
            VALUES ($1, $2, $3, $4, $5, $6);
        `,
        ['owen12', 'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwiaWF0IjoxNTgzMTc2NjUxfQ.RtA_uUsdujUaLZ5F-5w282GEpv_oWjApe8rAH_g4sEk', 'Owen', 'Portland', 45.5051, -122.6750]);

        await Promise.all(
            saved.map(favorite => {
                return client.query(`
                    INSERT into saved (user_id, name, images, genre, start_date, tickets_url, city, state, price_min, price_max, lat, long)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    RETURNING *;
                `,
                [1, favorite.name, favorite.images, favorite.classifications.genre.name, favorite.dates.start.localDate, favorite.url, favorite.venues.city.name, favorite.venues.state.name, favorite.priceRanges.min, favorite.priceRanges.max, favorite.venues.location.latitude, favorite.venues.location.longitude]);
            })
        );
        console.log('seed data load complete');
    }
    catch (err) {
        console.log(err);
    }
    finally {
        client.end();
    }
}