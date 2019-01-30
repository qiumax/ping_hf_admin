var mongoose = require("mongoose");
var Product = require("../models/Product");

var productController = {};

productController.addPing = function(req, res) {

};

productController.product = function(req, res) {
    console.log(req.body.id);
    // res.send("get product of id: " + req.body.id);

    Product.findOne({'_id':req.body.id}, function (err, product) {
        console.log(product);
        res.send(product);
    })
};

module.exports = productController;