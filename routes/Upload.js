// upload.js

var express = require('express');
var router = express.Router();
var Secret = require('../Secret.Class');
var DB = require("../DB.class");
var fs = require('fs');
var multer  = require('multer');

// 使用硬盘存储模式设置存放接收到的文件的路径以及文件名
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 接收到文件后输出的保存路径（若不存在则需要创建）
        cb(null, './public/video/');    
    },
    filename: function (req, file, cb) {
        if(file.mimetype == "video/mp4"){
            cb(null, Secret.Encrypt((new Date()).getTime()) + ".mp4");
        }else{
            cb(null, req.params.id+".png");
        }
                 
    }
});

// 创建文件夹
var createFolder = function(folder){
    try{
        // 测试 path 指定的文件或目录的用户权限,我们用来检测文件是否存在
        // 如果文件路径不存在将会抛出错误"no such file or directory"
        fs.accessSync(folder); 
    }catch(e){
        // 文件夹不存在，以同步的方式创建文件目录。
        fs.mkdirSync(folder);
    }  
};

var uploadFolder = './public/video/';
createFolder(uploadFolder);

// 创建 multer 对象
var upload = multer({ storage: storage });

/* POST upload listing. */
router.post('/', upload.single('video'), function(req, res, next) {
    var file = req.file;
    var name = file.filename;
    name = name.slice(0,-4);
    var data = {};
    data.code = 0;
    data.hash = name;
    // 接收文件成功后返回数据给前端
    res.send(Secret.Encrypt(JSON.stringify(data)));
});

router.post("/:id",upload.single('poster'),function(req,res,next){
    console.log(req.file);
    var data = {};
    if(req.session.userid == undefined){
        data.code = -1;
        data.msg ="请先登录";
        res.send(Secret.Encrypt(JSON.stringify(data)));
        return;
    }
    if(req.body.Video_Hash == "" || req.body.Video_Title == ""){
        data.code = 1;
        data.msg ="必填信息不完整";
        res.send(Secret.Encrypt(JSON.stringify(data)));
    }else{
        DB.AddVideo(req.body.Video_Hash,req.body.Video_Title,req.session.userid,function(err){
            if(err){
                data.code = 1;
                data.msg ="数据库提交出错！"
            }else{
                data.code = 0;
            }
            console.log(data);
            res.send(Secret.Encrypt(JSON.stringify(data)));
        })
    }
})
// 导出模块（在 app.js 中引入）
module.exports = router;