require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const basicAuth = require('express-basic-auth');

const app = express();
const port = process.env.PORT || 3000;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

app.use(basicAuth({
  authorizer: (username, password) => {
    const userMatches = basicAuth.safeCompare(username, process.env.BASIC_AUTH_USERNAME);
    const passwordMatches = basicAuth.safeCompare(password, process.env.BASIC_AUTH_PASSWORD);
    return userMatches & passwordMatches;
  },
  challenge: true,
  realm: 'Imb4T3st4pp',
}));

app.get('/get-cities', (req, res) => {
  const { latitude, longitude, distance } = req.query;

  if (!latitude || !longitude || !longitude) {
    return res.status(400).send('Latitude and longitude are required.');
  }

  const safeLatitude = pool.escape(latitude);
  const safeLongitude = pool.escape(longitude);
  const safeDistance = pool.escape(distance);

  const sql = `
    SELECT *, (6371 *
      acos(
        cos(radians(${safeLatitude})) *
        cos(radians(latitude)) *
        cos(radians(${safeLongitude}) - radians(longitude)) +
        sin(radians(${safeLatitude})) *
        sin(radians(latitude))
      )) AS distance
    FROM cidades
    HAVING distance <= ${safeDistance};
  `;

  pool.query(sql, (error, results) => {
    if (error) {
      return res.status(500).send('Error executing query.');
    }

    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`API is listening on port ${port}`);
});
