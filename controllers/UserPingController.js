var mongoose = require("mongoose");
var UserPing = require("../models/UserPing");
var Redpack = require("../models/Redpack");
var dateformat = require("dateformat");
var Excel = require('exceljs');
var Tempfile = require('tempfile');
var userPingController = {};

// userPingController.ping_id = function(req, res) {
//     console.log(req.body);
//     var ping_id = req.body.ping_id;
//     UserPing.find({
//         ping_id: ping_id
//     }).then(userpings=>{
//         res.render('userpings', {
//             userpings: userpings
//         });
//     })
// };

userPingController.edit = function(req, res) {
    var user_ping_id = req.params.user_ping_id;
    UserPing.findById(user_ping_id)
        .then(userping=>{
            console.log(userping);
            res.render('userping_edit', {
                userping: userping
            });
        })
};

//列表
userPingController.list = function (req,res) {

	var page = req.query.page || 1

	var page_size = req.query.page_size || req.app.get('config').page_size

	UserPing.count({pay_state:0}, function(err, count) {
		if (err) throw err
		console.log(count)
		UserPing.find({
			pay_state:0
		}).sort({created_at:1}).skip((page-1)*page_size).limit(page_size).then(userpings=>{
			userpings.forEach(userping=>{
				userping.create_time = moment(userping.updated_at).format('YYYY-MM-DD HH:mm:ss')

			})
			console.log(userpings);
			res.render('userping', {
				title:'用户拼团',
				userpings: userpings,
				page: page,
				page_total: count % page_size == 0? count/page_size:(Math.floor(count/page_size)+1)
			});
		})
	})

	// UserPing.find({}).then(userping=>{
	// 	console.log(userping)
	// 	res.render('userping', {
	// 		userping,userping
	// 	});
	// })
}

userPingController.user_ping_id = function(req, res) {
	console.log(req.body)
	var query = req.body.query
	var pattern = query
	var reg = {$regex: pattern, $options:"i"}
    UserPing.find({
	    $or: [
		    {name: reg},
		    {phone: reg}
	    ]
    })
    .then(userping=>{
        console.log(userping);
        res.render('userping', {
        	title:'搜索结果',
            userpings: userping
        });
    })
};

userPingController.update = function(req, res) {
    console.log(req.body);
    var user_ping_id = req.body.user_ping_id;

    var updates = {};
    if(req.body.refunded) {
        updates.refunded = req.body.refunded;
    }
    else if(req.body.processed) {
        updates.processed = req.body.processed;
    }

    if(req.body.notes) {
        updates.notes = req.body.notes;
    }

    console.log(updates);

    UserPing.findByIdAndUpdate(
        user_ping_id,
        {$set: updates},
        {new: true},
        function (err, userping) {
            res.redirect('/api/userping/edit/'+user_ping_id);
        }
    )
};

userPingController.excel = function (req, res) {
    var workbook = new Excel.Workbook();
    var worksheet = workbook.addWorksheet('MySheet');
    worksheet.columns = [
        { header: '订单ID', key: 'id', width: 30 },
        { header: '拼团ID', key: 'ping_id', width: 30 },
        { header: '参团人数', key: 'finish_num', width: 15 },
        { header: '参团时间', key: 'created_at', width: 20 },
        { header: '姓名', key: 'name', width: 15, style: { font: { bold:true } } },
        { header: '电话', key: 'phone', width: 15, style: { font: { bold:true } } },
        { header: '优惠金额', key: 'bonus', width: 15, style: { font: { bold:true, color:{ argb: 'FFFF0000' } } } },
        { header: '待处理', key: 'action', width: 15 },
    ];

    UserPing.find({
        ping_finish: 1,
        need_process: true
    }).then(userpings=>{

        userpings.forEach(userping=>{
            var action = "";
            if(userping.need_refund) {
                action = "待退款";
            }
            else if(userping.need_process) {
                action = "待联络";
            }

            worksheet.addRow({
                id: userping._id.toString(),
                ping_id: userping.ping_id.toString(),
                finish_num: userping.finish_num,
                created_at: dateformat(userping.created_at, 'yyyy/mm/dd hh:MM'),
                name: userping.name,
                phone: userping.phone,
                bonus: userping.bonus,
                action: action
            });
        })

        for(var i=1; i<=userpings.length+1; i++) {
            worksheet.getCell('A'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('B'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('C'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('D'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('E'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('F'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('G'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('H'+i).alignment = { vertical: 'middle', horizontal: 'center' };
        }

        var tempFilePath = Tempfile('.xlsx');
        workbook.xlsx.writeFile(tempFilePath).then(function() {
            console.log('file is written');
            res.sendFile(tempFilePath, function(err){
                console.log('---------- error downloading file: ' + err);
            });
        });
    })
}

var moment = require('moment');
var nodemailer = require('nodemailer');
userPingController.excel_email = function () {

    var date = moment().add(-1, 'days');
    var start_ts = moment(date).startOf('day').unix();
    var end_ts = moment(date).endOf('day').unix();

    console.log(date.toDate().toLocaleString());
    console.log(start_ts);
    console.log(end_ts);

    var workbook = new Excel.Workbook();
    var worksheet = workbook.addWorksheet('MySheet');
    worksheet.columns = [
        { header: '订单ID', key: 'id', width: 30 },
        { header: '拼团ID', key: 'ping_id', width: 30 },
        { header: '参团人数', key: 'finish_num', width: 15 },
        { header: '参团时间', key: 'created_at', width: 20 },
        { header: '姓名', key: 'name', width: 15, style: { font: { bold:true } } },
        { header: '电话', key: 'phone', width: 15, style: { font: { bold:true } } },
        { header: '优惠金额', key: 'bonus', width: 15, style: { font: { bold:true, color:{ argb: 'FFFF0000' } } } },
        { header: '待处理', key: 'action', width: 15 },
    ];

    UserPing.find({
        ping_finish: 1,
        ping_finish_time: {$gt: start_ts, $lt: end_ts}
    }).sort({need_process: -1})
    .then(userpings=>{

        userpings.forEach(userping=>{
            var action = "";
            if(userping.need_refund) {
                action = "待退款";
            }
            else if(userping.need_process) {
                action = "待联络";
            }

            worksheet.addRow({
                id: userping._id.toString(),
                ping_id: userping.ping_id.toString(),
                finish_num: userping.finish_num,
                created_at: dateformat(userping.created_at, 'yyyy/mm/dd hh:MM'),
                name: userping.name,
                phone: userping.phone,
                bonus: userping.bonus,
                action: action
            });
        })

        for(var i=1; i<=userpings.length+1; i++) {
            worksheet.getCell('A'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('B'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('C'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('D'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('E'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('F'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('G'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('H'+i).alignment = { vertical: 'middle', horizontal: 'center' };
        }

        var yesterday_str = dateformat(new Date(new Date().getTime()-24*3600*1000), 'yyyy-mm-dd');
        console.log(yesterday_str);

        var tempFilePath = Tempfile('.xlsx');
        workbook.xlsx.writeFile(tempFilePath).then(function() {
            console.log('file is written');
            // res.download(tempFilePath, yesterday_str + '.xlsx', function (err) {
            //     console.log('---------- error downloading file: ' + err);
            // })

            // Email:
            let transporter = nodemailer.createTransport({
                service: 'qq',
                auth: {
                    user: '80544634@qq.com',
                    pass: 'nqkfrwvoplrscbce'
                }
            });

            let mailOptions = {
                from: '拼团项目Admin<80544634@qq.com>', // sender address
                to: '80544634@qq.com', // list of receivers
                subject: yesterday_str + ' 拼团数据', // Subject line
                text: '', // plain text body
                html: '', // html body
                attachments: [
                    {
                        filename: yesterday_str + '.xlsx',
                        path: tempFilePath
                    }
                ]
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log(error);
                }
                console.log('Message %s sent: %s', info.messageId, info.response);
                // res.send('success');
            });
        });
    })

}

userPingController.redpack_excel = function (req, res) {

    var workbook = new Excel.Workbook();
    var worksheet = workbook.addWorksheet('MySheet');
    worksheet.columns = [
        { header: '用户ID', key: 'wxid', width: 30 },
        { header: '名称', key: 'name', width: 30 },
        { header: '电话', key: 'phone', width: 30 },
        { header: '红包个数', key: 'count', width: 30 },
        { header: '红包总额', key: 'total', width: 30, style: { font: { bold:true, color:{ argb: 'FFFF0000' } } }  }
    ];

    Redpack.aggregate([
        {
            $match:{
                redpack_sent: false
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "to_user_id",
                foreignField: "_id",
                as: "user"
            }
        },
        {
            $group:{
                _id: {
                    user_id: "$user._id",
                    name: "$user.name",
                    phone: "$user.phone"
                },
                total:{$sum:"$amount"},
                count:{$sum:1}
            }
        },
        {
            $project:{
                _id: "$_id",
                total: 1,
                count: 1
            }
        }
    ]).then(function (redpacks) {
        //console.log(redpacks);

        redpacks.forEach(redpack=>{
            console.log(redpack);

            worksheet.addRow({
                wxid: redpack._id.user_id[0].toString(),
                name: redpack._id.name[0],
                phone: redpack._id.phone[0],
                count: redpack.count,
                total: redpack.total/100
            });
        })

        for(var i=1; i<=redpacks.length+1; i++) {
            worksheet.getCell('A'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('B'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('C'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('D'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('E'+i).alignment = { vertical: 'middle', horizontal: 'center' };
        }

        var tempFilePath = Tempfile('.xlsx');
        workbook.xlsx.writeFile(tempFilePath).then(function() {
            console.log('file is written');

            // Email:
            let transporter = nodemailer.createTransport({
                service: 'qq',
                auth: {
                    user: '80544634@qq.com',
                    pass: 'nqkfrwvoplrscbce'
                }
            });

            var date_str = dateformat(new Date(new Date().getTime()), 'yyyy-mm-dd');

            let mailOptions = {
                from: '拼团项目Admin<80544634@qq.com>', // sender address
                to: '80544634@qq.com', // list of receivers
                subject: '拼团红包数据', // Subject line
                text: '', // plain text body
                html: '', // html body
                attachments: [
                    {
                        filename: date_str + '.xlsx',
                        path: tempFilePath
                    }
                ]
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log(error);
                }
                console.log('Message %s sent: %s', info.messageId, info.response);
                // res.send('success');
            });
        });
    })
}

module.exports = userPingController;
