var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var UserPing = require('./UserPing');
var User = require('./User');
var Weixin = require("./Weixin");
// var Manager = require('./Manager');

var PingSchema = new Schema({
    product_id: String,
    product_name: String,
    price_origin: Number,
    price_bottom: Number,
    sponsor_bonus: Number,
    less_minus: Number,
    rules: [{
        num: Number,
        bonus: Number
    }],
    total: Number,
    finish_num: Number,
    expire: Number,
    sub_fee: Number,
    sponsor: String,
    sponsor_name: String,
    sponsor_phone: String,
    sponsor_avatar: String,
    state: Number,
    finish_time: Number,
    need_refund: Boolean,
    refunded: Boolean,
    need_process: Boolean,
    processed: Boolean,
    bonus: Number
}, {timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}});

module.exports = mongoose.model('Ping', PingSchema, 'pings');