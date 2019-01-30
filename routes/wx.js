var express = require('express');
var router = express.Router();
var wxController = require("../controllers/WxController.js");

router.post('/getWxUserInfo', wxController.getWxUserInfo);

router.post('/payNotify', wxController.payNotify);

// router.post('/testTemp', wxController.testTemp);

module.exports = router;