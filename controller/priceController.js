const Price = require('../models/products');
const amazonTracker = require('../amazonTracker');
const flipkartTracker = require('../flipkartTracker');

exports.createTracker = async (req, res) => {
  try {
    const { productUrl, website, targetPrice, userEmail } = req.body;
    
    if (!productUrl || !website || !targetPrice) {
      return res.status(400).json({ message: 'Product URL, website, and target price are required' });
    }

    // Check if tracker already exists
    const existingTracker = await Price.findOne({ productUrl, website });
    if (existingTracker) {
      return res.status(400).json({ message: 'This product is already being tracked' });
    }

    // Create new tracker
    const newTracker = new Price({
      productUrl,
      website,
      targetPrice: parseFloat(targetPrice)
    });

    // Perform initial price check
    let initialCheck;
    switch (website) {
      case 'amazon':
        console.log('Using Amazon tracker');
        initialCheck = await amazonTracker.checkPrice(productUrl);
        console.log('Amazon tracker result:', initialCheck);
        break;
      case 'flipkart':
        console.log('Using Flipkart tracker');
        initialCheck = await flipkartTracker.checkPrice(productUrl);
        console.log('Flipkart tracker result:', initialCheck);
        break;
      default:
        return res.status(400).json({ message: 'Unsupported website' });
    }

    if (initialCheck.success) {
      newTracker.productName = initialCheck.title;
      newTracker.currentPrice = initialCheck.price;
      newTracker.lastChecked = new Date();
      newTracker.isTargetReached = initialCheck.price <= targetPrice;
    }

    await newTracker.save();
    res.status(201).json(newTracker);
  } catch (error) {
    console.error('Error creating tracker:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllTrackers = async (req, res) => {
  try {
    const trackers = await Price.find().sort({ createdAt: -1 });
    res.json(trackers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getTracker = async (req, res) => {
  try {
    const tracker = await Price.findById(req.params.id);
    if (!tracker) {
      return res.status(404).json({ message: 'Tracker not found' });
    }
    res.json(tracker);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateTracker = async (req, res) => {
  try {
    const tracker = await Price.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!tracker) {
      return res.status(404).json({ message: 'Tracker not found' });
    }
    res.json(tracker);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteTracker = async (req, res) => {
  try {
    const tracker = await Price.findByIdAndDelete(req.params.id);
    if (!tracker) {
      return res.status(404).json({ message: 'Tracker not found' });
    }
    res.json({ message: 'Tracker deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.checkCurrentPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const tracker = await Price.findById(id);
    
    if (!tracker) {
      return res.status(404).json({ message: 'Tracker not found' });
    }

    let priceCheck;
    switch (tracker.website) {
      case 'amazon':
        priceCheck = await amazonTracker.checkPrice(tracker.productUrl);
        break;
      case 'flipkart':
        priceCheck = await flipkartTracker.checkPrice(tracker.productUrl);
        break;
      default:
        return res.status(400).json({ message: 'Unsupported website' });
    }

    if (priceCheck.success) {
      tracker.currentPrice = priceCheck.price;
      tracker.lastChecked = new Date();
      tracker.isTargetReached = priceCheck.price <= tracker.targetPrice;
      
      if (!tracker.productName || tracker.productName === 'Product name not fetched yet') {
        tracker.productName = priceCheck.title;
      }
      
      await tracker.save();
      res.json(tracker);
    } else {
      res.status(400).json({ message: 'Failed to check price', error: priceCheck.error });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};