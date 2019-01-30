var mongoose = require("mongoose");
var Ping = require("../models/Ping");
var UserPing = require("../models/UserPing");
var Redpack = require("../models/Redpack");
var dateformat = require("dateformat");
var Excel = require('exceljs');
var Tempfile = require('tempfile');
var moment = require("moment");
var pingController = {};

pingController.pinging = function(req, res) {
    console.log(req.body);

    Ping.find({
        state: 1
    }).then(pings=>{
        pings.forEach(ping=>{
            ping.create_time = dateformat(ping.created_at, 'yyyy-mm-dd HH:MM ')
        })
        res.render('ping', {
            title: "拼团中",
            pings: pings
        });
    })
};

/*
pingController.toRefund = function(req, res) {
    console.log(req.body);

    Ping.find({
        state: 2,
        need_refund: true,
        refunded: false
    }).then(pings=>{
        pings.forEach(ping=>{
            ping.create_time = dateformat(ping.created_at, 'yyyy/mm/dd hh:MM')
        })
        res.render('ping', {
            title: "待处理",
            pings: pings
        });
    })
};
*/

pingController.toProcess = function(req, res) {
    console.log(req.body);

    Ping.find({
        state: 2,
        need_process: true,
        processed: false
    }).then(pings=>{
        pings.forEach(ping=>{
            ping.create_time = dateformat(ping.created_at, 'yyyy-mm-dd HH:MM')
        })
        res.render('ping', {
            title: "待处理",
            pings: pings
        });
    })
};

/*
pingController.refunded = function(req, res) {
    console.log(req.body);

    Ping.find({
        state: 2,
        refunded: true
    }).then(pings=>{
        pings.forEach(ping=>{
            ping.create_time = dateformat(ping.created_at, 'yyyy/mm/dd hh:MM')
        })
        res.render('ping', {
            title: "已处理",
            pings: pings
        });
    })
};
*/

pingController.processed = function(req, res) {
    console.log(req.body);

    Ping.find({
        state: 2,
        processed: true
    }).then(pings=>{
        pings.forEach(ping=>{
            ping.create_time = dateformat(ping.created_at, 'yyyy-mm-dd HH:MM')
        })
        res.render('ping', {
            title: "已处理",
            pings: pings
        });
    })
};

pingController.excelhongbao = function (req,res) {
	var ping_id =  req.query.ping_id


	var workbook = new Excel.Workbook();
	var worksheet = workbook.addWorksheet('MySheet');
	worksheet.columns = [
		{ header: '拼团ID', key: 'ping_id', width: 30 },
		{ header: '用户ID', key: 'wxid', width: 30 },
		{ header: '名称', key: 'name', width: 30 },
		{ header: '电话', key: 'phone', width: 30 },
		{ header: '红包个数', key: 'count', width: 30 },
		{ header: '红包总额', key: 'total', width: 30, style: { font: { bold:true, color:{ argb: 'FFFF0000' } } }  }
	];

	UserPing.find({ping_id:ping_id}).then(userpings=>{
		var userpingids = new Array()
		userpings.forEach(userping=>{
			userpingids.push(userping._id)
		})
		Redpack.aggregate([
			{
				$match:{
					redpack_sent: false,
					user_ping_id:{$in:userpingids}
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
					ping_id: ping_id,
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
				worksheet.getCell('F'+i).alignment = { vertical: 'middle', horizontal: 'center' };
			}

			var tempFilePath = Tempfile('.xlsx');
			workbook.xlsx.writeFile(tempFilePath).then(function() {
				console.log('file is written');
				res.sendFile(tempFilePath, function(err){
					console.log('---------- error downloading file: ' + err);
				});
			});
		})
	})


}
pingController.excelping = function (req,res) {
	var ping_id =  req.query.ping_id
	var workbook = new Excel.Workbook();
	var worksheet = workbook.addWorksheet('MySheet');
	worksheet.columns = [
		{ header: '订单ID', key: 'id', width: 30 },
		{ header: '拼团ID', key: 'ping_id', width: 30 },
		{ header: '拼团开始时间', key: 'ping_start', width: 30 },
		{ header: '拼团结束时间', key: 'ping_end', width: 30 },
		{ header: '参团人数', key: 'finish_num', width: 15 },
		{ header: '参团时间', key: 'created_at', width: 20 },
		{ header: '姓名', key: 'name', width: 15, style: { font: { bold:true } } },
		{ header: '电话', key: 'phone', width: 15, style: { font: { bold:true } } },
		{ header: '产品型号', key: 'product', width: 20 },
		{ header: '30公分小斗', key: 'cm30', width: 20 },
		{ header: '40公分小斗', key: 'cm40', width: 20 },
		{ header: '换装加大斗', key: 'huanzhuang', width: 20 },
		{ header: '加大斗', key: 'jiazhuang', width: 20 },
		{ header: '安装破碎锤管路', key: 'posui', width: 20 },
		{ header: 'SYB40破碎锤及管路', key: 'syb40', width: 20 },
		{ header: '订单金额', key: 'price', width: 15, style: { font: { bold:true, color:{ argb: 'FFFF0000' } } } },
		{ header: '优惠金额', key: 'bonus', width: 15, style: { font: { bold:true, color:{ argb: 'FFFF0000' } } } },
		{ header: '备注', key: 'remark', width: 15 },
		{ header: '待处理', key: 'action', width: 15 },
	];

	UserPing.find({
		ping_finish: 1,
		need_process: true,
		ping_id:ping_id
	}).populate('ping_id').then(userpings=>{
		console.log(userpings)

		userpings.forEach(userping=>{
			var cm30 = 0
			var	cm40 = 0
			var	huanzhuang = 0
			var	jiazhuang = 0
			var	posui = 0
			var	syb40 = 0
			var action = "";

			userping.setupdetail.forEach(setup=>{
				if(setup.desc=='30公分小斗')
				{
					cm30 = setup.num
				}
				if(setup.desc=='40公分小斗')
				{
					cm40 = setup.num
				}
				if(setup.desc=='换装加大斗')
				{
					huanzhuang = setup.num
				}
				if(setup.desc=='加大斗')
				{
					jiazhuang = setup.num
				}
				if(setup.desc=='安装破碎锤管路')
				{
					posui = setup.num
				}
				if(setup.desc=='SYB40破碎锤及管路')
				{
					syb40 = setup.num
				}
			})
			if(userping.need_refund) {
				action = "待退款";
			}
			else if(userping.need_process) {
				action = "待联络";
			}
			console.log(userping.price)
			worksheet.addRow({
				id: userping._id.toString(),
				ping_id: userping.ping_id._id.toString(),
				ping_start:dateformat(userping.ping_id.created_at, 'yyyy/mm/dd HH:MM'),
				ping_end:dateformat(userping.ping_id.updated_at, 'yyyy/mm/dd HH:MM'),
				finish_num: userping.finish_num,
				created_at: dateformat(userping.created_at, 'yyyy/mm/dd HH:MM'),
				name: userping.name,
				phone: userping.phone,
				product:userping.ping_id.product_name,
				cm30:cm30,
				cm40:cm40,
				huanzhuang:huanzhuang,
				jiazhuang:jiazhuang,
				posui:posui,
				syb40:syb40,
				price:userping.price,
				bonus: userping.bonus,
				remark: userping.remark,
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
			worksheet.getCell('I'+i).alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('J'+i).alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('K'+i).alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('L'+i).alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('M'+i).alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('N'+i).alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('O'+i).alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('P'+i).alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('Q'+i).alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('R'+i).alignment = { vertical: 'middle', horizontal: 'center' };
			worksheet.getCell('S'+i).alignment = { vertical: 'middle', horizontal: 'center' };
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

module.exports = pingController;
