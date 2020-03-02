require('dotenv').config();
// Application Dependencies
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const pg = require('pg');
// Application Setup
const app = express();
app.use(express.json());
//read incoming json data
app.use(express.urlencoded({ extended: true }));
//parsing application
app.use(morgan('dev')); // http logging
app.use(cors()); // enable CORS request
app.use(express.static('public')); // server files from /public folder
const Client = pg.Client;
const client = new Client(process.env.DATABASE_URL);
client.connect();
//connect to database client
const PORT = process.env.PORT || 3000;




// Auth Routes
const createAuthRoutes = require('./lib/auth/create-auth-routes.js');
const authRoutes = createAuthRoutes({
    selectUser(email) {
        return client.query(`
            SELECT id, email, hash 
            FROM users
            WHERE email = $1;
        `,
        [email]
        ).then(result => result.rows[0]);
    },
    insertUser(user, hash) {
        return client.query(`
            INSERT into users (email, hash)
            VALUES ($1, $2)
            RETURNING id, email;
        `,
        [user.email, hash]
        ).then(result => result.rows[0]);
    }
});
// before ensure auth, but after other middleware:
app.use('/api/auth', authRoutes);
// for every route, on every request, make sure there is a token
const ensureAuth = require('./lib/auth/ensure-auth.js');
app.use('/api/me', ensureAuth);
app.get('/api/festivals', async(req, res) => {
    const data = await request.get(`https://app.ticketmaster.com/discovery/v2/events.json?countryCode=US&keyword=fairs%20and%20festivals&apikey=${process.env.TICKETMASTER_KEY}`);
    res.json(data.body);
});
app.get('/api/me/saved', async(req, res) => {
    try {
        const saved = await client.query(`
        SELECT * FROM saved
        WHERE user_id = $1
        ORDER BY id;
        `,
        [req.userId]
        );
        res.json(saved.rows);
    }
    catch (err){
        console.log(err);
    }
});
app.post('/api/me/saved', async(req, res) => {
    try {
        const newSaved = await client.query(`
            INSERT into saved (user_id, name, images, start_date, tickets_url)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `,
        [req.userId, req.body.name, req.body.images[1], req.body.dates.start.localDate, req.body.url]);
        res.json(newFavorite.rows[0]);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            error: err.message || err
        });
    }
});
app.delete('/api/me/favorites/:id', async(req, res) => {
    // get the id that was passed in the route:
    try {
        const favorite = await client.query(`
            DELETE FROM favorites
            WHERE id = $1
            RETURNING *;
        `, [req.params.id]);
        res.json(favorite.rows[0]);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            error: err.message || err
        });
    }
});
// Start the server
app.listen(PORT, () => {
    console.log('server running on PORT', PORT);
});