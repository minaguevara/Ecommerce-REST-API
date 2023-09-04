const express = require('express');
const router = express.Router();

const db = require('../db');

// GET all products
router.get('/', (req, res) => {
  db.query('SELECT * FROM products', (err, result) => {
    if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } else {
        res.status(200).json(result.rows);
    }
    });
});

// Add more CRUD routes for products as needed
module.exports = router;
