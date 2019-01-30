var express = require('express');
var router = express.Router();
var userPingController = require("../controllers/UserPingController.js");

// router.get('/ping_id', userPingController.ping_id);

router.get('/user_ping_id', function (req, res) {
    res.render('userping');
});

router.get('/edit/:user_ping_id', userPingController.edit);

router.post('/user_ping_id', userPingController.user_ping_id);

router.post('/update', userPingController.update);

router.post('/excel', userPingController.excel);

router.get('/list',userPingController.list);


// router.get('/excel_email', userPingController.excel_email);
router.get('/redpack_excel', userPingController.redpack_excel);

module.exports = router;