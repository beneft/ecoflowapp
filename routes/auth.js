var express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
var router = express.Router();

const User = require('../models/User');

router.post('/register', async (req, res) => {
    try {
        const { username, email, password, pots } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            pots: pots || []
        });

        await newUser.save();
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
});

// Login Route
router.post('/login', passport.authenticate('local'), (req, res) => {
    res.json({ success: true, message: 'Logged in successfully' });
});

// Logout Route
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.json({ success: true });
    });
});

module.exports = router;