var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CurrentPingSchema = new Schema({
    ping_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'Ping'
    }
}, {timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}});

module.exports = mongoose.model('CurrentPing', PingSchema, 'current_ping');