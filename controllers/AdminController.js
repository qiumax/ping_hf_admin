var mongoose = require("mongoose");
var Admin = require("../models/Admin");

var adminController = {};

adminController.register = function(req, res) {
    console.log(req.body);
    Admin.register(new Admin({ username: req.body.username }), req.body.password, function (err, admin) {
        if(err) res.send(err);
        else res.send(admin);
    })
};

adminController.login = function(req, res) {
    console.log(req.body);
    Admin.register(new Admin({ username: req.body.username }), req.body.password, function (err, admin) {
        if(err) res.send(err);
        else res.send(admin);
    })
};

module.exports = adminController;
