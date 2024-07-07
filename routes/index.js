var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: 'EcoFlow App', isAuthenticated: req.isAuthenticated()});
});

router.get('/58907890/weather', (req, res) => {
  res.json({ apiKey: process.env.WEATHER_API_KEY });
});

module.exports = router;
