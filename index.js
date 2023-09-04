const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt'); // For password hashing
const db = require('./db'); // Replace with the correct path to your db.js file

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Configure express-session middleware
app.use(
    session({
        secret: 'your-secret-key',
        resave: false,
        saveUninitialized: false,
    })
);

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

// passport-local strategy
passport.use(
    new LocalStrategy(
    {
        usernameField: 'username', // Field name for username in the request body
        passwordField: 'password', // Field name for password in the request body
    },
    async (username, password, done) => {
        try {
          const user = await db.query('SELECT * FROM users WHERE username = $1', [username]);

            if (user.rows.length === 0) {
                return done(null, false, { message: 'Incorrect username.' });
            }

            const passwordMatch = await bcrypt.compare(password, user.rows[0].password);

            if (!passwordMatch) {
                return done(null, false, { message: 'Incorrect password.' });
            }

            return done(null, user.rows[0]);
        } catch (error) {
            return done(error);
        }
    }
    )
);

// Serialize and deserialize user for session management
passport.serializeUser((user, done) => {
    done(null, user.id);
}); 
    
passport.deserializeUser(async (id, done) => {
    try {
      const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);

        if (user.rows.length === 0) {
            return done(null, false);
        }

        return done(null, user.rows[0]);
    } catch (error) {
        return done(error);
    }
});

// Routes
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const ordersRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');

app.use('/products', productRoutes);
app.use('/users', userRoutes);
app.use('/orders', ordersRoutes);
app.use('/cart', cartRoutes);

// Error handling middleware
app.use((req, res, next) => {
    try {
        next();
    } catch (error) {
        res.status(error.statusCode || 500);
        res.json({ error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});