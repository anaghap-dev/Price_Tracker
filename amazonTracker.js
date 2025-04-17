const axios = require('axios');
const cheerio = require('cheerio');

// Replace with your Amazon product URL
const URL = 'https://www.amazon.in/dp/B0DGHYDZR9'; // iPhone link (India)
const TARGET_PRICE = 150000.00;

const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "max-age=0",
    "Connection": "keep-alive"
};

exports.checkPrice = async (productUrl) => {
    try {
        const response = await axios.get(productUrl, { headers: HEADERS });
        const $ = cheerio.load(response.data);

        const title = $('#productTitle').text().trim();
        if (!title) {
            return { success: false, error: 'Could not find product title' };
        }

        let priceText = $('.a-price-whole').first().text().trim();
        priceText = priceText.replace(/[₹,]/g, '');
        let price = parseFloat(priceText);

        if (isNaN(price)) {
            return { success: false, error: 'Could not parse the price' };
        }

        return {
            success: true,
            title: title,
            price: price
        };
    } catch (error) {
        console.error('Error fetching Amazon product page:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};