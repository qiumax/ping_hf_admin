var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ManagerSchema = new Schema({
    name: String,
    phone: String,
    wx: String,
    email: String,
    avatar: String,
    appoint_num: Number
}, {timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}});

module.exports = mongoose.model('Manager', ManagerSchema, 'managers');