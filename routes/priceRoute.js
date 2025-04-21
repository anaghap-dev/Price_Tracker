const express = require('express');
const router = express.Router();
const priceController = require('../controller/priceController');

// Create a new price tracker
router.post('/price-items', priceController.createTracker);

// Get all trackers
router.get('/price-items', priceController.getAllTrackers);

// Get a specific tracker
router.get('/price-items/:id', priceController.getTracker);

// Update a tracker
router.put('/price-items/:id', priceController.updateTracker);

// Delete a tracker
router.delete('/price-items/:id', priceController.deleteTracker);

// Check current price
router.get('/price-items/:id/check', priceController.checkCurrentPrice);

module.exports = router;