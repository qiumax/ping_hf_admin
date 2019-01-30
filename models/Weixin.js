module.exports = Weixin;

var config = require("../config/wx");
var request = require('request');
const qs = require('querystring');

const _appid = config.appid;
const _secret = config.secret;
const _key = config.key;
const _mchid = config.mchid;
const _notify_url = config.notify_url;

var accessToken = "";
var accessTokenTime = 0;

function Weixin() {

}

// Weixin Login
Weixin.getWxUserInfo = function(code, cb) {
    request.get({
        url: "https://api.weixin.qq.com/sns/jscode2session",
        json: true,
        qs:{
            grant_type: 'authorization_code',
            appid: _appid,
            secret: _secret,
            js_code: code
        }
    }, function(err, resp, data) {
        cb(err, resp, data);
    });
}

// Weixin Pay
Weixin.jsapipay = function (opts, cb) {
    var out_trade_no = opts.user_ping_id;
    var appid = _appid;
    var attach = opts.attach;
    var mch_id = _mchid;
    var nonce_str = opts.nonce_str;
    var total_fee = opts.sub_fee;
    var notify_url = _notify_url;
    var openid = opts.openid;
    var body = opts.description;
    var timeStamp = opts.timestamp;
    var spbill_create_ip = '47.106.98.38';
    var url = "https://api.mch.weixin.qq.com/pay/unifiedorder";
    var formData  = "<xml>";
    formData  += "<appid>"+appid+"</appid>";  //appid
    formData  += "<attach>"+attach+"</attach>"; //附加数据
    formData  += "<body>"+body+"</body>";
    formData  += "<mch_id>"+mch_id+"</mch_id>";  //商户号
    formData  += "<nonce_str>"+nonce_str+"</nonce_str>"; //随机字符串，不长于32位。
    formData  += "<notify_url>"+notify_url+"</notify_url>";
    formData  += "<openid>"+openid+"</openid>";
    formData  += "<out_trade_no>"+out_trade_no+"</out_trade_no>";
    formData  += "<spbill_create_ip>"+spbill_create_ip+"</spbill_create_ip>";
    formData  += "<total_fee>"+total_fee+"</total_fee>";
    formData  += "<trade_type>JSAPI</trade_type>";
    formData  += "<sign>"+paysignjsapi(appid,attach,body,mch_id,nonce_str,notify_url,openid,out_trade_no,spbill_create_ip,total_fee,'JSAPI')+"</sign>";
    formData  += "</xml>";
    console.log('formData: ');
    console.log(formData);
    request({url:url,method:'POST',body: formData},function(err,response,body){
        if(!err && response.statusCode == 200){
            console.log('body');
            console.log(body);
            var prepay_id = getXMLNodeValue('prepay_id',body.toString("utf-8"));
            var tmp = prepay_id.split('[');
            var tmp1 = tmp[2].split(']');
            //签名

            console.log('timeStamp: ');
            console.log(timeStamp);

            var _paySignjs = paysignjs(appid,nonce_str,'prepay_id='+tmp1[0],'MD5',timeStamp);

            console.log(tmp1[0]);
            console.log(_paySignjs);

            cb({prepay_id:tmp1[0],_paySignjs:_paySignjs});

            //res.render('weixinpay',{prepay_id:tmp1[0],_paySignjs:_paySignjs});
            //res.render('jsapipay',{rows:body});
            //res.redirect(tmp3[0]);
        }
    });
}

function paysignjsapi(appid,attach,body,mch_id,nonce_str,notify_url,openid,out_trade_no,spbill_create_ip,total_fee,trade_type) {
    var ret = {
        appid: appid,
        attach: attach,
        body: body,
        mch_id: mch_id,
        nonce_str: nonce_str,
        notify_url:notify_url,
        openid:openid,
        out_trade_no:out_trade_no,
        spbill_create_ip:spbill_create_ip,
        total_fee:total_fee,
        trade_type:trade_type
    };
    var string = raw(ret);
    var key = _key;
    string = string + '&key='+key;
    var crypto = require('crypto');
    return crypto.createHash('md5').update(string,'utf8').digest('hex');
};

function paysignjs(appid,nonceStr,package,signType,timeStamp) {
    var ret = {
        appId: appid,
        nonceStr: nonceStr,
        package:package,
        signType:signType,
        timeStamp:timeStamp
    };
    var string = raw(ret);
    var key = _key;
    string = string + '&key='+key;
    console.log(string);
    var crypto = require('crypto');
    return crypto.createHash('md5').update(string,'utf8').digest('hex');
};

function raw(args) {
    var keys = Object.keys(args);
    keys = keys.sort()
    var newArgs = {};
    keys.forEach(function (key) {
        // Ding
        if ( key != 'sign' ){
            newArgs[key] = args[key];
        }
    });
    var string = '';
    for (var k in newArgs) {
        string += '&' + k + '=' + newArgs[k];
    }
    string = string.substr(1);
    return string;
};

function getXMLNodeValue(node_name,xml){
    var tmp = xml.split("<"+node_name+">");
    var _tmp = tmp[1].split("</"+node_name+">");
    return _tmp[0];
}

Weixin.verifyNotify = function(xml, cb) {
    var parser = require('xml2js').parseString;
    parser(xml, function (err, result) {
        if ( result.xml.result_code[0] == 'SUCCESS' ) {
            // console.log(result);
            var string = raw(result.xml)
            // console.log( string );
            string = string + '&key=' + _key;
            // console.log(string);
            var crypto = require('crypto');
            var sign = crypto.createHash('md5').update(string,'utf8').digest('hex').toUpperCase();
            console.log( sign );
            // console.log( "39A31E194597ED6BE11A2FF27176938B" );
            if ( sign === result.xml.sign[0] ) {
                // console.log( 'pass' );
                var out_trade_no = result.xml.out_trade_no[0];
                var openid = result.xml.openid[0];
                // Purchase.setPaid(out_trade_no);

                cb(out_trade_no, openid);
                return;
            }
        }
        cb(null);
    });
}

Weixin.sendTemplateMsg = function (data) {
    this.getAccessToken();

    var reqUrl = 'https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=' + accessToken;

    var string = JSON.stringify(data);
    console.log(string);

    var options = {
        url: reqUrl,
        method: "POST",
        body: string
    };

    console.log(options);

    return new Promise( function(resolve, reject) {
        request(options, function (err, res, body) {
            if (res) {
                var data = JSON.parse(body);
                console.log("sendTemplateMsg success");
                console.log(data);
                resolve(data);
            } else {
                console.log(err);
                reject(err);
            }
        })
    });
}

Weixin.getAccessToken = function() {
    console.log("accessToken");
    console.log(accessToken);

    console.log("accessTokenTime");
    console.log(accessTokenTime);

    console.log("差值");
    console.log(new Date().getTime()/1000-accessTokenTime);

    if(accessToken && accessToken.length>0 && (new Date().getTime()/1000-accessTokenTime)<7200) {
        return new Promise( function(resolve, reject) {
            resolve(accessToken);
        });
    }
    else {
        var reqUrl = 'https://api.weixin.qq.com/cgi-bin/token?';
        var params = {
            appid: _appid,
            secret: _secret,
            grant_type: 'client_credential'
        };

        var options = {
            method: 'get',
            url: reqUrl+qs.stringify(params)
        };
        // console.log(options.url);
        return new Promise( function(resolve, reject) {
            request(options, function (err, res, body) {
                if (res) {
                    var data = JSON.parse(body);
                    accessToken = data.access_token;
                    accessTokenTime = Math.floor(new Date().getTime()/1000);
                    resolve(accessToken);
                } else {
                    reject(err);
                }
            })
        });
    }
}