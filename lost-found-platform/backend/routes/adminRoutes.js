const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminController');

router.post('/create-police', adminCtrl.createPoliceUser);

module.exports = router;
