var express = require('express');
var router = express.Router();
var DB = require('../DB.class');
var Secret = require('../Secret.Class');
re = /select|update|delete|exec|count|'|"|=|;|>|<|%/i;
/* 
功能：用户登录
参数：usermail,password,captcha
方式：Post
依赖：Sqlite3
时间：2019年3月16日21点08分
*/
router.post("/Login", function (req, res, next) {
    var usermail = req.body.usermail;
    var password = req.body.password;
    var captcha = req.body.captcha;
    var respone = {};
    if (captcha != req.session.captcha) {
        respone.code = 0;
        respone.msg = '验证码错误';
        res.send(Secret.Encrypt(JSON.stringify(respone)));
        return;
    }
    DB.UserLogin(usermail, password, function (err, data) {
        if (err) {
            respone.code = 0;
            respone.msg = data;
            res.send(Secret.Encrypt(JSON.stringify(respone)));
            return;
        } else {
            respone.code = 1;
            respone.msg = '欢迎回来，'+data.User_Name+"！";
            req.session.userid = data.User_ID;
            res.send(Secret.Encrypt(JSON.stringify(respone)));
            return;
        }
    })
});

/* 
功能：用户注册
参数：usermail,nickname,password
依赖：sqlite3 
方式：POST
时间：2019年3月16日22点31分*/
router.post("/Register", function (req, res, next) {
    var usermail = req.body.usermail;
    var nickname = req.body.nickname;
    var password = req.body.password;
    var captcha = req.body.captcha;
    var respone = {};
    if (captcha != req.session.captcha) {
        respone.code = 0;
        respone.msg = '验证码错误';
        res.send(Secret.Encrypt(JSON.stringify(respone)));
        return;
    }
    DB.UserRegister(usermail, nickname, password, function (err,data) {
        if (err) {
            respone.code = 0;
            respone.msg = data;
            res.send(Secret.Encrypt(JSON.stringify(respone)));
            return;
        } else {
            respone.code = 1;
            respone.msg = '欢迎您，' + nickname + "！";
            res.send(Secret.Encrypt(JSON.stringify(respone)));
            return;
        }
    })
});

router.post('/Password',function(req,res,next){
    var respone={};
    if(!req.session.userid ||!req.body.password){
        respone.code = 1;
        res.send(Secret.Encrypt(JSON.stringify(respone)));
        return;
    }
    DB.ChangePassword(req.session.userid,req.body.password,function(err){
        if(err){
            respone.code = 1;
            res.send(Secret.Encrypt(JSON.stringify(respone)));
            return;
        }else{
            respone.code = 0;
            req.session.userid = undefined;
            res.send(Secret.Encrypt(JSON.stringify(respone)));
            return;
        }
    })
});
router.get('/LoginOut',function(req,res,next){
    if(req.session.userid){
        req.session.userid = undefined;
    }
    var respone={};
    respone.code = 0;
    res.send(Secret.Encrypt(JSON.stringify(respone)));
});
router.get("/IsLogin",function(req,res,next){
    var respone={};
    if(req.session.userid){
        respone.code = 1;
    }else{
        respone.code = 0;
        respone.userid = req.session.userid;
    }
    res.send(Secret.Encrypt(JSON.stringify(respone)));
});

router.get("/",function(req,res,next){
    var data={};
    if(!req.session.userid){
        data.code = -1;
        data.msg = "尚未登录!";
        res.send(Secret.Encrypt(JSON.stringify(data)));
        return;
    }
    DB.FindUserByID(req.session.userid, function (err, info) {
        if (err) {
          data.code = 1;
          data.msg = "服务器内部错误"
          res.send(Secret.Encrypt(JSON.stringify(data)));
          return;
        }
        data.code = 0;
        data.info = info;
        res.send(Secret.Encrypt(JSON.stringify(data)));
      });
});
module.exports = router;