const express = require('express');
const router = express.Router();
const priceController = require('../controller/priceController');

// Create a new price tracker
router.post('/price', priceController.createTracker);

// Get all trackers
router.get('/price', priceController.getAllTrackers);

// Get a specific tracker
router.get('/price/:id', priceController.getTracker);

// Update a tracker
router.put('/price/:id', priceController.updateTracker);

// Delete a tracker
router.delete('/price/:id', priceController.deleteTracker);

// Check current price
router.get('/price/:id/check', priceController.checkCurrentPrice);

module.exports = router;