const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    username: {
        type: String,
        required: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    rol: {
        type: String,
        default: 'user',
    },
});


module.exports = mongoose.model('User', userSchema);
