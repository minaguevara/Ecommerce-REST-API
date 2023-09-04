const express = require('express');
const router = express.Router();
const passport = require('../passport');
const bcrypt = require('bcrypt'); // For password hashing
const db = require('../db');

router.use(passport.initialize());

// POST /register - Register a new user
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if the username already exists
        const userExists = await db.query('SELECT * FROM users WHERE username = $1', [username]);

        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash the password before storing it
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert the new user into the database
        const insertUserQuery = 'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *';
        const newUser = await db.query(insertUserQuery, [username, hashedPassword]);

        res.status(201).json(newUser.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /login - User login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.status(200).json({ message: 'Authentication successful' });
        });
    })(req, res, next);  
});

// GET /users/{userId} - Get user information by ID (requires authentication)
router.get('/:userId', isAuthenticated, async (req, res) => {
    const userId = req.params.userId;

    try {
        // Check if the user exists
        const getUserQuery = 'SELECT id, username FROM users WHERE id = $1';
        const user = await db.query(getUserQuery, [userId]);

        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /users/{userId} - Update user information by ID (requires authentication)
router.put('/:userId', isAuthenticated, async (req, res) => {
    const userId = req.params.userId;
    const { username, password } = req.body;

    try {
        // Check if the user exists
        const userExists = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

        if (userExists.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update the user's information
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const updateUserQuery = 'UPDATE users SET username = $1, password = $2 WHERE id = $3';
        await db.query(updateUserQuery, [username, hashedPassword, userId]);

        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Authentication required' });
}

module.exports = router;