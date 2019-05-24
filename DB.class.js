var sqlite3 = require('sqlite3').verbose();
let dbName = 'db.db';
var db = new sqlite3.Database(dbName);
re= /select|update|delete|exec|count|'|"|=|;|>|<|%/i;
class DB{
    /* 用户登录的数据库操作 */
    static UserLogin(usermail,password,cb){
        //判断是否有sql注入语句
        if(re.test(usermail) || re.test(password)){
            cb(true,'非法字符');
            return;
        }
        db.get(`select * from User where User_Mail = ? AND User_Password=?`,usermail,password,function(err,data){
            if(err){
                cb(true,"服务器内部错误");
            }else{
                if(data){
                    cb(false,data);
                }else{
                    cb(true,"用户名或密码错误");
                }
            }
        });
    }
    static UserRegister(usermail,nickname,password,cb){
        if(re.test(usermail) || re.test(nickname) || re.test(password)){
            cb(true,'非法字符！');
            return;
        }
        db.get(`select User_ID from User where User_Mail = ? `,usermail,function(err,data){
            if(err){
                cb(true,"服务器内部错误！");
            }else{
                if(data){
                    cb(true,"邮箱已经注册！");
                    return;
                }
                db.get(`select User_ID from User where User_Name = ? `,nickname,function(err,data){
                    if(err){
                        cb(true,"服务器内部错误！");
                    }else{
                        if(data){
                            cb(true,"昵称已被占用！");
                            return;
                        }
                        db.run(`Insert INTO User('User_Mail','User_Name','User_Password') VALUES(?,?,?)`,usermail,nickname,password,function(err){
                            if(err){
                                cb(true,"服务器内部错误！");
                            }else{
                                cb(false);
                            }
                        });
                    }
                });
            }
        });
    }

    static VideoList(type,pageid,cb){
        var pagesize = 5;
        var pagestart = (pageid-1)*pagesize;
        var sql = "";
        if(type == 'New'){
            sql = "select Video.Video_ID, Video.Video_Hash,Video.Video_Title,Count(Likes.User_ID) AS Video_Like from Video left join Likes On Likes.Video_Hash = Video.Video_Hash Group BY Video.Video_Hash ORDER BY Video_ID DESC LIMIT ? OFFSET ? ";
        }else{
            sql = "select Video.Video_Hash,Video.Video_Title,Count(Likes.User_ID) AS Video_Like from Video left join Likes On Likes.Video_Hash = Video.Video_Hash Group BY Video.Video_Hash ORDER BY Video_Like DESC LIMIT ? OFFSET ? ";
        }
        db.all(sql,pagesize,pagestart,cb);
    }
    static AddVideo(hash,title,user,cb){
        db.run(`INSERT INTO Video('Video_Hash','Video_Title','User_ID') Values(?,?,?)`,hash,title,user,function(err){
            if(err){
                console.log(err);
                cb(true);
            }else{
                cb(false);
            }
        });
    }
    static FindUserByID(id,cb){
        var info = {};
        db.get(`SELECT * FROM User WHERE User_ID = ? `, id, function(err,data){
            if(err){
                console.log(err);
                cb(err);
                return;
            }
            info.User_Name = data.User_Name;
            info.User_ID = data.User_ID;
            db.get("select count(Video_Hash) count from Likes where User_ID = ?",id,function(err2,data2){
                if(err2){
                    console.log(err2);
                    cb(err2);
                    return;
                }
                info.Like_Count = data2.count;
                db.get("select count(Video_Hash) count from Comment where User_ID = ?",id,function(err3,data3){
                    if(err3){
                        console.log(err3);
                        cb(err3);
                        return;
                    }
                    info.Comment_Count = data3.count;
                    cb(false,info);
                });
            });
        });
    }

    static getComment(hash,cb){
        if(re.test(hash)){
            cb(true,"存在SQL注入！");
            return;
        }
        db.all(`select Comment.Comment_ID,Comment.Comment_Content,Comment.Comment_Time,User.User_Name from Comment left join User ON Comment.User_ID = User.User_ID where Video_Hash = ?`,hash,cb);
    }

    static GetVideo(hash,userid,cb){
        if(re.test(hash)){
            cb(true,"存在SQL注入！");
            return;
        }
        db.get('select * from Video where Video_Hash=?',hash,function(err,data){
            if(err){
                cb(true,"内部错误！");
                return;
            }
            if(!data){
                cb(true,"无此视频！");
                return;
            }
            db.get('select count(*) as count from Likes where Video_Hash = ?',hash,function(err1,data1){
                if(err1){
                    cb(true,"内部错误！");
                    return;
                }
                data.Video_Like = data1.count;
                if(userid !=""){
                    db.get('select count(*) as count from Likes where Video_Hash = ? AND User_ID = ?',hash,userid,function(err2,data2){
                        if(err2){
                            cb(true,"内部错误！");
                            return;
                        }
                        data.Liked = data2.count;
                        cb(false,data);
                    });
                }else{
                    data.Liked =0;
                    cb(false,data);
                }
            });
        });
    }
    static addComment(hash,comment,userid,cb){
        var time = new Date().Format("yyyy-MM-dd HH:mm:ss");
        db.run(`INSERT INTO Comment('Video_Hash','User_ID','Comment_Content','Comment_Time') Values(?,?,?,?)`,hash,userid,comment,time,cb);
    }
    static addLike(hash,userid,cb){
        db.run('INSERT INTO Likes values(?,?)',hash,userid,function(err){
            if(err){
                console.log(err);
                db.run('Delete from Likes where Video_Hash=? And User_ID=?',hash,userid,function(err1){
                    if(err1){
                        cb(0);
                    }else{
                        cb(-1);
                    }
                });
            }else{
                cb(1);
            }
        });
    }
    static MyList(type,userid,cb){
        var sql ="";
        if(type=='MyVideo'){
            sql = "select Video.Video_Hash,Video.Video_Title,Count(Likes.User_ID) AS Video_Like from Video left join Likes On Likes.Video_Hash = Video.Video_Hash where Video.User_ID = ? Group BY Video.Video_Hash ORDER BY Video_Like DESC";
        }else{
            sql = `select Video.Video_Hash,Video.Video_Title,Count(Likes.User_ID) AS Video_Like from Video left join Likes On Likes.Video_Hash = Video.Video_Hash where Video.Video_Hash in(select Video_Hash from Likes where User_ID=?) Group BY Video.Video_Hash ORDER BY Video_Like DESC `;
        }
        db.all(sql,userid,cb);
    }
    static ChangePassword(userid,password,cb){
        db.run(`Update User set User_Password = ? where User_ID =?`,password,userid,cb);
    }
}
Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "H+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
module.exports = DB;