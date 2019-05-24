var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

var HomeRouter = require('./routes/Home');
var UserRouter = require('./routes/User');
var UploadRouter = require('./routes/Upload');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'AD249WER1F9', //配置加密字符串，他会在原有加密基础上和这个字符串拼接起来再次加密，目的增加安全性
  resave: true,
  saveUninitialized: true //无论你是否使用session，都默认给你分配一把钥匙
}));


app.use('/', HomeRouter);
app.use('/User',UserRouter);
app.use('/Upload',UploadRouter);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  console.log(err);
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
