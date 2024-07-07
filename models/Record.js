const mongoose = require('mongoose');

var recordSchema = new mongoose.Schema({
    time: Date,
    humidity: Number,
    temperature: Number,
    lightLevel: Number,
    pot: String
});

module.exports = mongoose.model('Record', recordSchema);