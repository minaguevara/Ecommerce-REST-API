const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt'); // For password hashing
const db = require('./db'); // Import your database object

passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
}, async (username, password, done) => {
    try {
        // Check if the username and password are valid
        const queryResult = await db.query('SELECT * FROM users WHERE username = $1', [username]);

        if (queryResult.rows.length === 0) {
            return done(null, false, { message: 'Username or password is incorrect' });
        }

        const user = queryResult.rows[0];

        // Compare the password entered by the user with the password stored in the database
        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            return done(null, false, { message: 'Username or password is incorrect' });
        }

        // The user is authenticated
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));


module.exports = passport;