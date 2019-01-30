var mongoose = require("mongoose");
var Ping = require("../models/Ping");
var Product = require("../models/Product")
var User = require("../models/User");
var UserPing = require("../models/UserPing");
var UserPingOther = require("../models/UserPingOther")
var moment = require("moment");
var dateformat = require("dateformat");
var Excel = require('exceljs');
var Tempfile = require('tempfile');
var userController = {};

// wx
userController.userpings = function(req, res) {
    console.log(req.body);
    console.log('here');
    var user_id = req.body.user_id;
    UserPing.find({
        user_id: user_id
    }).populate('ping_id').then(ups=>{
        console.log(ups)
        res.send(ups)
    })
};

userController.userping = function(req, res) {
    console.log(req.body);
    console.log('here');
    var user_ping_id = req.body.user_ping_id;
    UserPing.findById(user_ping_id).populate('ping_id').then(up=>{
        console.log(up)
        res.send(up)
    })
};

userController.failuser = function (req,res) {
    var page = req.query.page || 1

    var page_size = req.query.page_size || req.app.get('config').page_size

    UserPingOther.count({ }, function(err, count) {
        if (err) throw err
        console.log(count)
        UserPingOther.find({}).sort({created_at:1}).skip((page-1)*page_size).limit(page_size).populate("product").then(users=>{
            users.forEach(user=>{
                user.create_time = moment(user.created_at).format('YYYY-MM-DD HH:mm:ss')
				console.log(user.product)
            })
            console.log(users)
            res.render('users_other', {
                title:'其他地区用户',
                users: users,
                page: page,
                page_total: count % page_size == 0? count/page_size:(Math.floor(count/page_size)+1)
            })
        })
    })

}



userController.excelfailuser = function (req,res) {
    var date1 = req.query.date1
    var date2 = req.query.date2

    var workbook = new Excel.Workbook();
    var worksheet = workbook.addWorksheet('MySheet');
    worksheet.columns = [
        { header: '姓名', key: 'name', width: 30 },
        { header: '电话', key: 'phone', width: 30 },
        { header: '产品', key: 'product', width: 30 },
        { header: '城市', key: 'city', width: 30 },
        { header: '提交时间', key: 'createtime', width: 30 },
    ];

    UserPingOther.find({
        created_at:{$gte:date1},
        created_at:{$lte:date2}
    }).populate("product").then(users=>{
        console.log(users)
        users.forEach(user=>{
            worksheet.addRow({
                name: user.name,
                phone: user.phone,
				product:user.product.name,
                city: user.location,
	            createtime: dateformat(user.created_at, 'yyyy/mm/dd HH:MM'),
            });

        })

        for(var i=1; i<=users.length+1; i++) {
            worksheet.getCell('A'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('B'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('C'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('D'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('E'+i).alignment = { vertical: 'middle', horizontal: 'center' };
        }

        var tempFilePath = Tempfile('.xlsx');
        workbook.xlsx.writeFile(tempFilePath).then(function() {
            console.log('file is written');
            res.sendFile(tempFilePath)
        });
    })
}


userController.exceluser = function (req,res) {
	var date1 = req.query.date1
	var date2 = req.query.date2



    var workbook = new Excel.Workbook();
    var worksheet = workbook.addWorksheet('MySheet');
    worksheet.columns = [
        { header: '姓名', key: 'name', width: 30 },
        { header: '电话', key: 'phone', width: 30 },
        { header: '城市', key: 'city', width: 30 },
        { header: '注册时间', key: 'createtime', width: 30 },
    ];

    User.find({
        join_num: 0,
        phone: {
            $exists: true
        },
		created_at:{$gte:date1},
		created_at:{$lte:date2}
    }).then(users=>{
		console.log(users)
		users.forEach(user=>{
            worksheet.addRow({
                name: user.name,
                phone: user.phone,
                city: user.city,
	            createtime: dateformat(user.created_at,'yyyy/mm/dd HH:MM'),
            });

		})

        for(var i=1; i<=users.length+1; i++) {
            worksheet.getCell('A'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('B'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('C'+i).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getCell('D'+i).alignment = { vertical: 'middle', horizontal: 'center' };
        }

        var tempFilePath = Tempfile('.xlsx');
        workbook.xlsx.writeFile(tempFilePath).then(function() {
            console.log('file is written');
            res.sendFile(tempFilePath)
        });
	})
}

userController.paid = function(req, res) {
	var page = req.query.page || 1

	var page_size = req.query.page_size || req.app.get('config').page_size

	User.count({
		join_num: {$gt:0},
		phone: {
			$exists: true
		}
	}, function(err, count) {
		if (err) throw err
		console.log(count)
		User.find({
			join_num: {$gt:0},
			phone: {
				$exists: true
			}
		}).sort({created_at:1}).skip((page-1)*page_size).limit(page_size).then(users=>{
			users.forEach(user=>{
				user.create_time = moment(user.created_at).format('YYYY-MM-DD HH:mm:ss')
				var follow_num = 0
				if(user.followers && user.followers.length>0){
					follow_num = user.followers.length
				}

				user.follow_num = follow_num
			})
			//console.log(users)
			res.render('users', {
				title:'已购用户',
				'pagetype':'paid',
				users: users,
				page: page,
				page_total: count % page_size == 0? count/page_size:(Math.floor(count/page_size)+1)
			})
		})
	})

	// UserPing.find({
	// 	pay_state: 1
	// }).select("-_id name phone created_at bonus").sort({created_at:-1}).then(ups=>{
	// 	ups.forEach(up=>{
	// 		up.create_time = dateformat(up.created_at, 'yyyy/mm/dd hh:MM')
	// 	})
	//
	// 	res.render("user_paid", {
	// 		userpings: ups
	// 	})
	// })
};


userController.interested = function(req, res) {
	var page = req.query.page || 1

	var page_size = req.query.page_size || req.app.get('config').page_size

	User.count({
		join_num: 0,
		phone: {
			$exists: true
		}
	}, function(err, count) {
		if (err) throw err
		console.log(count)
		User.find({
			join_num: 0,
			phone: {
				$exists: true
			}
		}).sort({created_at:1}).skip((page-1)*page_size).limit(page_size).then(users=>{
			users.forEach(user=>{
				user.create_time = moment(user.created_at).format('YYYY-MM-DD HH:mm:ss')
				var follow_num = 0
				if(user.followers && user.followers.length>0){
					follow_num = user.followers.length
				}

				user.follow_num = follow_num
			})
			//console.log(users)
			res.render('users', {
				title:'意向客户',
				'pagetype':'yixiang',
				users: users,
				page: page,
				page_total: count % page_size == 0? count/page_size:(Math.floor(count/page_size)+1)
			})
		})
	})


	// User.find({
	// 	join_num: 0,
	// 	phone: {
	// 		$exists: true
	// 	}
	// }).select("name phone created_at").sort({created_at:-1}).then(users=>{
	//
	// 	console.log(users);
	//
	// 	users.forEach(user=>{
	// 		user.create_time = dateformat(user.created_at, 'yyyy/mm/dd hh:MM')
	// 	})
	//
	// 	res.render("user_interested", {
	// 		users: users
	// 	})
	// })
};

userController.userlist = function (req,res) {
	var page = req.query.page || 1

	var page_size = req.query.page_size || req.app.get('config').page_size

	User.count({}, function(err, count) {
		if (err) throw err
		console.log(count)
		User.find({}).sort({created_at:1}).skip((page-1)*page_size).limit(page_size).then(users=>{
			users.forEach(user=>{
				user.create_time = moment(user.created_at).format('YYYY-MM-DD HH:mm:ss')
				var follow_num = 0
				if(user.followers && user.followers.length>0){
					follow_num = user.followers.length
				}

				user.follow_num = follow_num
			 })
			//console.log(users)
			res.render('users', {
				title:'用户列表',
				users: users,
				page: page,
				page_total: count % page_size == 0? count/page_size:(Math.floor(count/page_size)+1)
			})
		})
	})
}


userController.edit = function (req,res) {
	var id = req.query.id
	User.findById(id).then(user=>{
		console.log(user)
		user.create_time = moment(user.created_at).format('YYYY-MM-DD HH:mm:ss')
		var follow_num = 0
		var extra_reward1 = 0
		var extra_reward2 = 0
		if(user.followers && user.followers.length>0){
			follow_num = user.followers.length
		}
		if(user.extra_reward1){
			extra_reward1 = user.extra_reward1
		}
		if(user.extra_reward2){
			extra_reward2 = user.extra_reward2
		}
		user.follow_num = follow_num
		user.extra_reward1 = extra_reward1
		user.extra_reward2 = extra_reward2

		res.render('user_edit', {
			user: user
		})
	})
}


//更新
userController.update = function (req,res) {
	console.log(req.body)
	var user_id = req.body.user_id
	var extra_reward1 = req.body.extra_reward1
	var extra_reward2 = req.body.extra_reward2

	//判断是否为数字
	if(isNaN(extra_reward1))
	{
		extra_reward1 = 0
	}
	if(isNaN(extra_reward2))
	{
		extra_reward2 = 0
	}
	User.findById(user_id).then(user=>{
		user.extra_reward1 = extra_reward1
		user.extra_reward2 = extra_reward2

		user.save(function (err) {
			if(!err){
				res.redirect('/api/user/edit?id=' + user_id)
			}

		})
	})

}

//搜索
userController.search = function (req,res) {
	console.log(req.body)
	var query = req.body.query
	var pagetype = req.body.pagetype
	var pattern = query
	var reg = {$regex: pattern, $options:"i"}
	console.log(pagetype)
	if(pagetype == 'paid')
	{
		var yixiang = {
			$or: [
				{name: reg},
				{phone: reg}
			],
			join_num: {$gt:0},
			phone: {
				$exists: true
			}
		}
	}
	else
	{
		var yixiang = {
			$or: [
				{name: reg},
				{phone: reg}
			],
			join_num: 0,
			phone: {
				$exists: true
			}
		}
	}

	User.find(
		yixiang
	).sort({created_at:1}).then(users=>{
		console.log(users)
		users.forEach(user=>{
			user.create_time = moment(user.created_at).format('YYYY-MM-DD HH:mm:ss')
			var follow_num = 0
			if(user.followers && user.followers.length>0){
				follow_num = user.followers.length
			}

			user.follow_num = follow_num
		})
		//console.log(users)
		res.render('users', {
			title:'搜索结果',
			pagetype:pagetype,
			users: users

		})
	})


}

// admin

module.exports = userController;
