var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var flash = require('connect-flash');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://sa_ping_xy:wending0304@172.17.0.7:27017/ping_xy', { useNewUrlParser: true })
//mongoose.connect('mongodb://sa_ping_xy:wending0304@94.191.39.145:27017/ping-xy', { useNewUrlParser: true })
    .then(() =>  console.log('connection succesful'))
.catch((err) => console.error(err));

var session = require('express-session');
const RedisStore = require('connect-redis')(session);
var redis = require("redis");
var client = redis.createClient(6379, '172.17.0.15');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
    store: new RedisStore({
        host: "172.17.0.15",
        port: 6379,
        pass: 'Wd03041985!',
        ttl: 3600,
        client: client
    }),
    secret: "ping_xy_admin",
    cookie: { maxAge: 3600*1000 },
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));

var admin = require('./routes/admin');
var ping = require('./routes/ping');
var userping = require('./routes/userping');
var users = require('./routes/user');
// passport configuration
var Admin = require('./models/Admin');
passport.use(new LocalStrategy(Admin.authenticate()));
passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser());

app.use('/api', function (req, res, next) {
    if(req.isAuthenticated()){
        return next();
    }
    else {
        res.redirect('/admin/login');
    }
});

var config = require('./config/wx')
app.set('config', config);

app.use('/admin', admin);
app.use('/api/ping', ping);
app.use('/api/userping', userping);
app.use('/api/user', users);


// catch 404 and forward to error handler
app.use(function(req, res, next) {

    var err = new Error('Not Found');
    err.status = 404;
    next(err);
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

// schedule
var schedule = require("node-schedule");
var UserPingController = require('./controllers/UserPingController');
schedule.scheduleJob('0 40 1 * * ?', function(){
    console.log(new Date());
    console.log("excel_email");
    UserPingController.excel_email();
})

module.exports = app;
