var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserPingSchema = new Schema({
    //user_id: String,
    user_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    ping_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'Ping'
    },
    sponsor: String,
    name: String,
    phone: String,
    form_id: String,
    pay_form_id: String,
    sub_fee: Number,
    pay_state: Number,
    ping_finish: Number,
    ping_finish_time: Number,
    finish_num: Number,
    use_state: Number,
    bonus: Number,
	location:String,//户籍地
	remark:String,//订单备注
	product:String,//产品
    need_refund: Boolean,
    refunded: Boolean,
    need_process: Boolean,
    processed: Boolean,
    notes: String,
	price:Number,//产品总价
	setupdetail:[{
		desc: String,
		num: Number
	}]
    // m_name: String,
    // m_phone: String,
    // m_wx: String,
    // m_email: String,
    // m_avatar: String
    // manager: {
    //     type: mongoose.Schema.ObjectId,
    //     ref: 'Manager'
    // }
}, {timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}});

module.exports = mongoose.model('UserPing', UserPingSchema, 'user_pings');
