const express = require('express');
const router = express.Router();
const priceController = require('../controller/priceController');

// Create a new price tracker
router.post('/trackers', priceController.createTracker);

// Get all trackers
router.get('/trackers', priceController.getAllTrackers);

// Get a specific tracker
router.get('/trackers/:id', priceController.getTracker);

// Update a tracker
router.put('/trackers/:id', priceController.updateTracker);

// Delete a tracker
router.delete('/trackers/:id', priceController.deleteTracker);

// Check current price
router.get('/trackers/:id/check', priceController.checkCurrentPrice);

module.exports = router;