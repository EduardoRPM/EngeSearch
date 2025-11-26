const mongoose = require('mongoose');

const filmSchema = new mongoose.Schema({
    title: String,
    image: String,
    description: String,
    url: String,
});


module.exports = mongoose.model('film', filmSchema); 

