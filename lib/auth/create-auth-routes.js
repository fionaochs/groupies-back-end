const express = require('express');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('./jwt.js');
const request = require('superagent');
function getProfileWithToken(user) {
    // eslint-disable-next-line no-unused-vars
    const { hash, ...rest } = user;
    return {
        ...rest,
        token: jwt.sign({ id: user.id })
    };
}
const getLocation = async(location) => {
    const URL = `https://us1.locationiq.com/v1/search.php?key=${process.env.GEOCODE_API_KEY}&q=${location}&format=json`;
    const cityData = await request.get(URL);
    const firstResult = cityData.body[0];
    return firstResult;
}
module.exports = function createAuthRoutes(queries) {
    // eslint-disable-next-line new-cap
    const router = express.Router();
    router.post('/signup', async (req, res) => {
        const { password, ...user } = req.body;
        const email = user.email;
        let location = req.body.location;
        const displayname = req.body.display_name;
        location = await getLocation(location);
        const lat = location.lat;
        const long = location.lon;
        const city = location.display_name;
        // email and password needs to exist
        if (!email || !password) {
            res.status(400).json({ error: 'email and password required' });
            return;
        }
        // email needs to not exist already
        queries.selectUser(email)
            .then(foundUser => {
                if (foundUser) {
                    res.status(400).json({ error: 'email already exists' });
                    return;
                }
                // insert into profile the new user
                queries.insertUser(user, bcrypt.hashSync(password, 8), displayname, city, lat, long)
                    .then(user => {
                        res.json(getProfileWithToken(user));
                    })
                    .catch(err => {
                        res.status(400).json({ error: err.message });
                    });
            })
            .catch(err => {
                console.log(err);
                res.status(500).json({ error: 'Unexpected error' });
            });
    });
    router.post('/signin', (req, res) => {
        const body = req.body;
        const email = body.email;
        const password = body.password;
        // email and password needs to exist
        if (!email || !password) {
            res.status(400).json({ error: 'email and password required' });
            return;
        }
        queries.selectUser(email)
            .then(user => {
                // does email match one in db?
                // #1 !user - if no user, then no match on a row for email
                // #2 !compareSync - provided password did not match hash from db
                if (!user || !bcrypt.compareSync(password, user.hash)) {
                    res.status(400).json({ error: 'email or password incorrect' });
                    return;
                }
                res.json(getProfileWithToken(user));
            })
            .catch(err => {
                console.log(err);
                res.status(500).json({ error: 'Unexpected error' });
            });
    });
    return router;
};