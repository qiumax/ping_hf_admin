var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserPingOtherSchema = new Schema({
    //user_id: String,
    user_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    product:{
        type: mongoose.Schema.ObjectId,
        ref: 'Product'
    },
    name: String,
    phone: String,
    location:String,//户籍地
    shigong:String,//施工地
    remark:String,//订单备注
    price:Number,//产品总价
    setupdetail:[{
        desc: String,
        num: Number
    }],


}, {timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}});

module.exports = mongoose.model('UserPingOther', UserPingOtherSchema, 'user_pings_other');
