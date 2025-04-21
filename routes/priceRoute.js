const express = require('express');
const router = express.Router();
const priceController = require('../controller/priceController');

// Create a new price tracker
router.post('/catalog', priceController.createTracker);

// Get all trackers
router.get('/catalog', priceController.getAllTrackers);

// Get a specific tracker
router.get('/catalog/:id', priceController.getTracker);

// Update a tracker
router.put('/catalog/:id', priceController.updateTracker);

// Delete a tracker
router.delete('/catalog/:id', priceController.deleteTracker);

// Check current price
router.get('/catalog/:id/check', priceController.checkCurrentPrice);

module.exports = router;