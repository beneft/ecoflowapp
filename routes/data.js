
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var error = require('es-errors');

var Record = require('../models/Record');
const User = require('../models/User');

router.get('/day/:day', isAuthenticated, async function(req, res, next) {
    const day = new Date(req.params.day);
    const nextDay = new Date(day);
    nextDay.setUTCDate(day.getUTCDate()+1);
    nextDay.setUTCHours(0, 0, 0, 0);

    console.log(day);
    console.log(nextDay);

    const pot = req.query.pot ? decodeURIComponent(req.query.pot) : null;

    const user = req.user;
    const pots = await User.findById(user._id).select('pots');
    const userPots = pots.pots;

    let query;
    if (pot && userPots.includes(pot)) {
        query = {
            time: { $gte: day, $lt: nextDay },
            pot: pot
        };
    } else {
        query = {
            time: { $gte: day, $lt: nextDay },
            pot: {$in: userPots}
        };
    }

    const records = await Record.find(query).sort({ time: 1 });
    console.log(records);

    res.json(records);
});

router.get('/day/:day/now', isAuthenticated, async function(req, res, next) {
    const day = new Date(req.params.day);
    const lastDay = new Date(day);
    lastDay.setUTCDate(day.getUTCDate()-1);

    console.log(day);
    console.log(lastDay);

    const pot = req.query.pot ? decodeURIComponent(req.query.pot) : null;

    const user = req.user;
    const pots = await User.findById(user._id).select('pots');
    const userPots = pots.pots;

    let query;
    if (pot && userPots.includes(pot)) {
        query = {
            time: { $gte: lastDay, $lt: day },
            pot: pot
        };
    } else {
        query = {
            time: { $gte: lastDay, $lt: day },
            pot: { $in: userPots }
        };
    }

    const records = await Record.find(query).sort({ time: 1 });
    console.log(records);

    res.json(records);
});

router.get('/range', isAuthenticated, async function(req, res, next) {
    const decodedStart = decodeURIComponent(req.query.start);
    const decodedEnd = decodeURIComponent(req.query.end);
    const start = new Date(decodedStart);
    const end = new Date(decodedEnd);

    console.log(start);
    console.log(end);

    const pot = req.query.pot ? decodeURIComponent(req.query.pot) : null;

    const user = req.user;
    const pots = await User.findById(user._id).select('pots');
    const userPots = pots.pots;

    let query;
    if (pot && userPots.includes(pot)) {
        query = {
            time: { $gte: start, $lt: end },
            pot: pot
        };
    } else {
        query = {
            time: { $gte: start, $lt: end },
            pot: { $in: userPots }
        };
    }

    const records = await Record.find(query).sort({ time: 1 });
    console.log(records);

    res.json(records);
});


router.get('/pots', async function(req,res,next){
    try {
        const uniquePots = await Record.distinct('pot', {});

        console.log(uniquePots);
        res.json(uniquePots);
    } catch (error) {
        console.error(error);
        next(error);
    }
});

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ success: false, message: 'Unauthorized' });
}

router.get('/userpots', isAuthenticated, async (req, res) => {
    try {
        const user = req.user;

        const pots = await User.findById(user._id).select('pots');

        res.json({ success: true, pots: pots.pots });
    } catch (err) {
        console.error('Error fetching user pots:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch user pots' });
    }
});

router.post('/userpots/add', isAuthenticated, async (req, res) => {
    try {
        const { potName } = req.body;
        const user = req.user;

        const userPots = await User.findById(user._id).select('pots');
        if (userPots.pots.includes(potName)) {
            return res.json({ success: false, message: 'Pot already exists' });
        }

        userPots.pots.push(potName);
        await userPots.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Error adding user pot:', error.message);
        res.status(500).json({ success: false, message: 'Failed to add user pot' });
    }
});

router.post('/userpots/delete', isAuthenticated, async (req, res) => {
    try {
        const { potName } = req.body;
        const user = req.user;

        const userPots = await User.findById(user._id).select('pots');
        const index = userPots.pots.indexOf(potName);
        if (index === -1) {
            return res.json({ success: false, message: 'Pot does not exist' });
        }
        userPots.pots.splice(index, 1);
        await userPots.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting user pot:', error.message);
        res.status(500).json({ success: false, message: 'Failed to delete user pot' });
    }
});


module.exports = router;