var mongoose = require("mongoose");
var passport = require("passport");
var request = require('request');
var moment = require('moment');

var Weixin = require("../models/Weixin");
var User = require("../models/User");
var Ping = require("../models/Ping");
var UserPing = require("../models/UserPing");

var wxController = {};

wxController.getWxUserInfo = function(req, res) {
    console.log(req);

    var code = req.body.code;

    Weixin.getWxUserInfo(code, function (err, resp, data) {
        console.log("data: " + JSON.stringify(data));

        var openid = data.openid;
        var body = req.body;
        req.body.username = openid;
        req.body.password = "pwd";

        if(data.openid) {
            User.findOne({'openid':openid}, function (err, user) {
                // 存在
                if(user) {
                    console.log("registered");
                    passport.authenticate('local')(req, res, function () {
                        console.log({user_id: user._id, s_id: 'sess:' + req.session.id});
                        req.session.uid = user._id;
                        res.json({user_id: user._id, s_id: 'sess:' + req.session.id});
                    });
                }
                // 不存在
                else {
                    console.log("begin register");
                    User.register(
                        new User({
                            username: openid,
                            openid : openid,
                            name: req.body.nickname,
                            avatar: req.body.avatar,
                            gender: req.body.gender,
                            city: req.body.city,
                            province: req.body.province,
                            country: req.body.country
                        }),
                        req.body.password,
                        function(err, user) {
                            console.log(user);
                            console.log(err);
                            if (err) {
                                res.send('fail');
                            }

                            passport.authenticate('local')(req, res, function () {
                                console.log({user_id: user._id, s_id: 'sess:' + req.session.id});
                                req.session.uid = user._id;
                                res.json({user_id: user._id, s_id: 'sess:' + req.session.id});
                            });
                        }
                    );
                }
            })
        }
    });
};

wxController.payNotify = function(req, res) {
    console.log("weixin pay notify");

    var xml = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk) {
        xml += chunk;
        console.log( chunk );
    });
    req.on('end', function(chunk) {
        console.log( xml );
        Weixin.verifyNotify( xml, function(out_trade_no, openid){
            console.log('out_trade_no:' +out_trade_no);
            if ( out_trade_no && openid ) {
                User.findOne({
                    openid: openid
                }).then(user => {
                    UserPing.findById(out_trade_no).then(aUserPing => {
                        console.log("aUserPing");
                        console.log(aUserPing);

                        aUserPing.pay_state = 1;
                        aUserPing.save().then( up => {
                            Ping.findById(aUserPing.ping_id).then(ping => {
                                if(user._id == aUserPing.sponsor) {
                                    ping.state = 1;
                                }
                                ping.finish_num++;

                                ping.save().then( p => {
                                    // 模板消息
                                    var data = {
                                        touser: user.openid,
                                        template_id: "HkZES8gqOlFz4ENjE58ReYy_8H7-XujsUDG2k4o4rFk",
                                        form_id: aUserPing.form_id,
                                        data: {
                                            keyword1: {value: "三一重卡预付款"},
                                            keyword2: {value: aUserPing.sub_fee/100 + "元"},
                                            keyword3: {value: aUserPing._id},
                                            keyword4: {value: moment().format('YYYY-MM-DD HH:mm:ss')},
                                            keyword5: {value: "4009995318"}
                                        }
                                    }
                                    Weixin.sendTemplateMsg(data);

                                    res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>');
                                });
                            });
                        });
                    });
                });
            }
        });
    });
};

/*
wxController.testTemp = function(req, res) {
    // 模板消息
    var data = {
        touser: "o6wFd5cKJBJ-UimobdrI6SNtHPxI",
        template_id: "HkZES8gqOlFz4ENjE58ReYy_8H7-XujsUDG2k4o4rFk",
        form_id: "wx05180415886297e7e45827b81909539094",
        data: {
            keyword1: {value: "三一重卡预付款"},
            keyword2: {value: "500元"},
            keyword3: {value: "5be0159f8863e21bcb6149ec"},
            keyword4: {value: moment().format('YYYY-MM-DD HH:mm:ss')},
            keyword5: {value: "4009995318"}
        }
    }
    Weixin.sendTemplateMsg(data);
}
*/

module.exports = wxController;