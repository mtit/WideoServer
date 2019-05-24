var express = require('express');
var router = express.Router();
var svgCaptcha = require('svg-captcha');
var DB = require('../DB.class');
var Secret =require('../Secret.Class');

/* 
功能：获取图片验证码
依赖：svg-captcha、express-session;
时间：2019年3月16日20点39分
*/
router.get('/Captcha', function (req, res, next) {
  const cap = svgCaptcha.createMathExpr();
  req.session.captcha = cap.text;
  res.type('svg');
  res.send(cap.data);
});

/*
功能：获取热门视频列表
依赖：CryptoJS,express-session;
时间：2019年3月17日11点59分
*/
router.get('/Hot', function (req, res, next) {
  var pageid;
  if (req.query.refresh) {
    pageid = 1;
  } else {
    if (req.session.hotpageid) {
      pageid = req.session.hotpageid + 1;
    } else {
      pageid = 1;
    }
  }
  req.session.hotpageid = pageid;
  DB.VideoList('Hot', pageid, function (err, data) {
    var respone = {};
    if (err) {
      respone.code = 1;
      respone.msg = "服务器内部错误！";
      res.send(Secret.Encrypt(JSON.stringify(respone)));
    } else {
      respone.code = 0;
      respone.items = data;
      res.send(Secret.Encrypt(JSON.stringify(respone)));
    }
  });
});

/*  */
/*  */
router.get('/New', function (req, res, next) {
  var pageid;
  if (req.query.refresh) {
    pageid = 1;
  } else {
    if (req.session.newpageid) {
      pageid = req.session.newpageid + 1;
    } else {
      pageid = 1;
    }
  }
  req.session.newpageid = pageid;
  DB.VideoList('New', pageid, function (err, data) {
    var respone = {};
    if (err) {
      respone.code = 1;
      respone.msg = "服务器内部错误！";
      res.send(Secret.Encrypt(JSON.stringify(respone)));
    } else {
      respone.code = 0;
      respone.items = data;
      res.send(Secret.Encrypt(JSON.stringify(respone)));
    }
  });
});

router.get('/Comment', function (req, res, next) {
  var respone = {};
  var hash = req.query.Video_Hash;
  DB.getComment(hash,function(err,data){
    if(err){
      respone.code = 1;
      respone.msg = "服务器内部错误！";
    }else{
      respone.code = 0;
      respone.info = data;
    }
    res.send(Secret.Encrypt(JSON.stringify(respone)));
  });
});

router.post('/Comment', function (req, res, next) {
  console.log(req.body);
  var respone = {};
  var hash = req.body.Video_Hash;
  var comment = req.body.Comment_Content;
  if(!req.session.userid){
      respone.code = 1;
      respone.msg = "请先登录!";
      res.send(Secret.Encrypt(JSON.stringify(respone)));
      return;
  }
  DB.addComment(hash,comment,req.session.userid,function(err){
    if(err){
      respone.code = 1;
      respone.msg = "服务器内部错误！";
    }else{
      respone.code = 0;
    }
    res.send(Secret.Encrypt(JSON.stringify(respone)));
  });
});

/*  */
router.get('/', function (req, res, next) {
  var respone = {};
  if(!req.query.Video_Hash){
    res.send('Hi,There!');
    return;
  }
  var hash = req.query.Video_Hash;
  var userid="";
  if(req.session.userid){
    userid = req.session.userid;
  }else{
    userid = "";
  }
  DB.GetVideo(hash,userid,function(err,data){
    if(err){
      respone.code = 1;
      respone.msg = data;
    }else{
      respone.code = 0;
      respone.info = data;
    }
    res.send(Secret.Encrypt(JSON.stringify(respone)));
  });
});

router.get('/Like',function(req,res,next){
  var respone={};
  if(!req.query.Video_Hash){
    res.send('Hi,There!');
    return;
  }
  if(!req.session.userid){
    respone.code = 2;
    res.send(Secret.Encrypt(JSON.stringify(respone)));
    return;
  }
  DB.addLike(req.query.Video_Hash,req.session.userid,function(i){
    respone.code = i;
    res.send(Secret.Encrypt(JSON.stringify(respone)));
  });
});

router.get('/MyList',function(req,res,next){
  var respone={};
  var type = req.query.type;
  if(!req.query.type){
    respone.code = 1;
    respone.msg ="非法访问";
    res.send(Secret.Encrypt(JSON.stringify(respone)));
    return;
  }
  if(!req.session.userid){
    respone.code = 1;
    respone.msg ="请先登录";
    res.send(Secret.Encrypt(JSON.stringify(respone)));
    return;
  }
  DB.MyList(req.query.type,req.session.userid,function(err,data){
    if(err){
      respone.code = 1;
      respone.msg ="服务器内部错误";
      res.send(Secret.Encrypt(JSON.stringify(respone)));
      return;
    }else{
      respone.code = 0;
      console.log(data);
      respone.items =data;
      res.send(Secret.Encrypt(JSON.stringify(respone)));
      return;
    }
  })
});
module.exports = router;
