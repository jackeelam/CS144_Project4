var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

//My code to set the callback functions on requests
var blogRouter = require('./routes/blog');
var loginRouter = require('./routes/login');
var apiRouter = require('./routes/api');
var editorRouter = require('./routes/editor');
var client = require('./db');
//End my code

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/editor', editorRouter);
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

//My code

app.use('/blog', blogRouter);
app.use('/login', loginRouter);
app.use('/api', apiRouter);

//My code end

//Connect to Mongo on start
client.connect('mongodb://localhost:27017/', (err) => {
    if (err) {
        console.log('Unable to connect to Mongo!');
        process.exit(1);
    } 
    // else {
    //     app.listen(3000, () => {
    //         console.log('Listening on port 3000...');
    //     });
    // }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
