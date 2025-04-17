const axios = require('axios');
const cheerio = require('cheerio');

// Headers to mimic a browser request
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
        // Clean up the URL - remove query parameters
        const cleanUrl = productUrl.split('?')[0];
        
        console.log(`Fetching Flipkart product from: ${cleanUrl}`);
        
        const response = await axios.get(cleanUrl, { 
            headers: HEADERS,
            timeout: 15000
        });
        
        const $ = cheerio.load(response.data);
        
        // Try multiple approaches to find the title
        let title = '';
        
        // Common title selectors on Flipkart
        const titleSelectors = [
            'span.B_NuCI',         // Common product title
            'h1.yhB1nd',           // Alternative product title
            'h1._9E25nV',          // Another alternative
            'h1[class]',           // Any h1 with a class
            '.B_NuCI',             // Without the span
            '.prod-name',          // Generic product name class
            '.product-title'       // Generic product title class
        ];
        
        // Try each selector until we find a title
        for (const selector of titleSelectors) {
            const element = $(selector).first();
            if (element.length > 0) {
                title = element.text().trim();
                if (title) break;
            }
        }
        
        // If still no title, try to find any heading with product-like content
        if (!title) {
            $('h1').each((i, el) => {
                const text = $(el).text().trim();
                if (text.length > 10) { // Assuming product titles are reasonably long
                    title = text;
                    return false; // Break the each loop
                }
            });
        }
        
        if (!title) {
            console.error('Could not find product title');
            return { success: false, error: 'Could not find product title' };
        }
        
        // Try multiple approaches to find the price
        let price = 0;
        let priceFound = false;
        
        // Common price selectors on Flipkart
        const priceSelectors = [
            'div._30jeq3._16Jk6d',     // Common price selector
            'div._30jeq3',             // Alternative price selector
            '.a-price-whole',          // Another alternative
            '[class*="price"]',        // Any element with "price" in class name
            '[class*="Price"]',        // Any element with "Price" in class name
            'div[class*="_30jeq3"]'    // Elements with partial class match
        ];
        
        // Try each price selector
        for (const selector of priceSelectors) {
            const elements = $(selector);
            
            elements.each((i, el) => {
                const text = $(el).text().trim();
                if (text && (text.includes('₹') || text.includes('Rs.') || text.match(/^\d+,?\d+(\.\d+)?$/))) {
                    const cleanPrice = text.replace(/[^\d.]/g, '');
                    const parsedPrice = parseFloat(cleanPrice);
                    
                    if (!isNaN(parsedPrice) && parsedPrice > 0) {
                        price = parsedPrice;
                        priceFound = true;
                        return false; // Break the each loop
                    }
                }
            });
            
            if (priceFound) break;
        }
        
        // Last resort: look for any element containing currency symbols
        if (!priceFound) {
            $('*').each((i, el) => {
                const text = $(el).text().trim();
                if ((text.includes('₹') || text.includes('Rs.')) && 
                    text.length < 15) { // Price texts are usually short
                    
                    const cleanPrice = text.replace(/[^\d.]/g, '');
                    const parsedPrice = parseFloat(cleanPrice);
                    
                    if (!isNaN(parsedPrice) && parsedPrice > 0) {
                        price = parsedPrice;
                        priceFound = true;
                        return false; // Break the each loop
                    }
                }
            });
        }
        
        if (!priceFound) {
            console.error('Could not find product price');
            return { success: false, error: 'Could not find product price' };
        }
        
        console.log(`Successfully extracted: "${title}" - ₹${price}`);
        
        return {
            success: true,
            title: title,
            price: price
        };
    } catch (error) {
        console.error('Error fetching Flipkart product:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};