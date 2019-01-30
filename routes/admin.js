var express = require('express');
var router = express.Router();
var adminController = require("../controllers/AdminController.js");
var passport = require('passport');

router.post('/register', adminController.register);

router.post('/login', passport.authenticate('local', {
    successRedirect:'/api/ping/pinging',
    failureRedirect:'/admin/login',
    failureFlash:true
}));

router.get('/login', function (req, res) {
    res.render('login');
})

router.get('/register', function (req, res) {
    res.render('register');
})

module.exports = router;
