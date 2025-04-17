const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
  productUrl: {
    type: String,
    required: true,
    trim: true
  },
  website: {
    type: String,
    required: true,
    enum: ['amazon', 'flipkart', 'myntra']
  },
  targetPrice: {
    type: Number,
    required: true
  },
  currentPrice: {
    type: Number,
    default: null
  },
  productName: {
    type: String,
    default: 'Product name not fetched yet'
  },
  lastChecked: {
    type: Date,
    default: null
  },
  isTargetReached: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Price', priceSchema);