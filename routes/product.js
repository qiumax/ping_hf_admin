var express = require('express');
var router = express.Router();
var productController = require("../controllers/ProductController.js");

router.post('/', productController.product);

module.exports = router;