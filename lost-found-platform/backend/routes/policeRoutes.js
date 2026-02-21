const express = require('express');
const router = express.Router();
const policeCtrl = require('../controllers/policeController');

// All routes under /api/police are protected by auth + police middleware in server.js
router.get('/items', policeCtrl.getItems);
router.get('/matches', policeCtrl.getMatches);
router.get('/submissions', policeCtrl.getSubmissions);
router.get('/pending-physical', policeCtrl.getPendingPhysical);

router.post('/matches/:id/verify', policeCtrl.verifyMatch);
router.post('/matches/:id/reject', policeCtrl.rejectMatch);

router.post('/items/:id/store', policeCtrl.markStored);
router.post('/items/:id/close', policeCtrl.markClosed);
router.put('/items/:id/verify-physical', policeCtrl.verifyPhysical);

router.post('/submissions/:id/accept', policeCtrl.acceptSubmission);
router.post('/submissions/:id/reject', policeCtrl.rejectSubmission);

module.exports = router;
