var express = require('express');
var router = express.Router();

let settings = {
    options:{
        watering: 'water-never'
    },
    thresholds:{
        temperature: null,
        humidity: null,
        lightLevel: null
    }
}

router.post('/', function(req, res, next) {
    const { options, thresholds } = req.body;

    if (options) {
        settings.options = options;
    }
    if (thresholds) {
        settings.thresholds = thresholds;
    }

    res.status(200).json({ message: 'Settings updated successfully', settings });
});

router.get('/', function(req, res, next) {
    res.status(200).json(settings);
});

module.exports = router;