document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('track-form');
    const trackingStatus = document.getElementById('tracking-status');
    const productsContainer = document.getElementById('products-container');
    const noProducts = document.getElementById('no-products');
    const loader = document.getElementById('loader');
    
    const API_URL = 'https://pricetracker-backend-xtkv.onrender.com';
    
    // Website names map for display
    const websiteNames = {
        'amazon': 'Amazon',
        'flipkart': 'Flipkart',
        'myntra': 'Myntra'
    };
    
    // Format price with commas for Indian currency format
    function formatPrice(price) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(price);
    }
    
    // Format date for display
    function formatDate(dateString) {
        if (!dateString) return 'Never';
        
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Show loading state
    function showLoader() {
        loader.classList.remove('hidden');
        noProducts.classList.add('hidden');
    }
    
    // Show no products state
    function showNoProducts() {
        loader.classList.add('hidden');
        noProducts.classList.remove('hidden');
        productsContainer.innerHTML = '';
    }
    
    // Hide loader
    function hideLoader() {
        loader.classList.add('hidden');
    }
    
    // Create HTML element for a single product
    function createProductElement(product) {
        const productElement = document.createElement('div');
        productElement.className = 'tracked-product';
        productElement.dataset.id = product._id;
        
        const isTargetReached = product.isTargetReached;
        const statusClass = isTargetReached ? 'status-badge status-reached' : 'status-badge status-pending';
        const statusText = isTargetReached ? 'Target Price Reached!' : 'Waiting for price drop';
        
        productElement.innerHTML = `
            <div class="product-info">
                <div>
                    <span class="site-badge">${websiteNames[product.website] || product.website}</span>
                    <span class="product-name">${product.productName || 'Unknown Product'}</span>
                </div>
                <div class="product-url">
                    <a href="${product.productUrl}" target="_blank">View product</a>
                </div>
                <div class="price-info">
                    <div class="price-card current-price">
                        <div class="price-label">Current Price</div>
                        <div class="price-value">${formatPrice(product.currentPrice)}</div>
                    </div>
                    <div class="price-card target-price">
                        <div class="price-label">Target Price</div>
                        <div class="price-value">${formatPrice(product.targetPrice)}</div>
                    </div>
                </div>
                <div class="${statusClass}">
                    ${statusText}
                </div>
                <div class="last-checked">
                    Last checked: ${formatDate(product.lastChecked)}
                </div>
                <div class="actions">
                    <button class="check-price-btn" data-id="${product._id}">Check Current Price</button>
                    <button class="delete-tracker-btn delete-btn" data-id="${product._id}">Remove</button>
                </div>
            </div>
        `;
        
        // Add event listeners to the buttons
        const checkPriceBtn = productElement.querySelector('.check-price-btn');
        const deleteTrackerBtn = productElement.querySelector('.delete-tracker-btn');
        
        checkPriceBtn.addEventListener('click', function() {
            const trackerId = this.dataset.id;
            checkCurrentPrice(trackerId);
        });
        
        deleteTrackerBtn.addEventListener('click', function() {
            const trackerId = this.dataset.id;
            deleteTracker(trackerId);
        });
        
        return productElement;
    }
    
    // Update a specific product in the UI
    function updateProductInUI(productData) {
        const existingProduct = document.querySelector(`.tracked-product[data-id="${productData._id}"]`);
        
        if (existingProduct) {
            // Replace the existing product with updated one
            const updatedElement = createProductElement(productData);
            existingProduct.replaceWith(updatedElement);
        } else {
            // Add new product
            productsContainer.prepend(createProductElement(productData));
            noProducts.classList.add('hidden');
        }
    }
    
    // Load all products from the server
    async function loadAllProducts() {
        showLoader();
        trackingStatus.textContent = 'Loading tracked products...';
        
        try {
            // Changed endpoint name to avoid ad blockers
            const response = await fetch(`${API_URL}/catalog`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error('Failed to load products');
            }
            
            hideLoader();
            
            if (data.length === 0) {
                showNoProducts();
                trackingStatus.textContent = 'No products tracked yet.';
                return;
            }
            
            // Display all products
            productsContainer.innerHTML = '';
            data.forEach(product => {
                productsContainer.appendChild(createProductElement(product));
            });
            
            noProducts.classList.add('hidden');
            trackingStatus.textContent = 'Products loaded successfully.';
            
        } catch (error) {
            hideLoader();
            showNoProducts();
            trackingStatus.textContent = `Error: ${error.message}`;
        }
    }
    
    // Form submission - Start tracking a product
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const productUrl = document.getElementById('product-url').value;
        const website = document.getElementById('site').value;
        const targetPrice = document.getElementById('target-price').value;
        
        if (!productUrl || !website || !targetPrice) {
            trackingStatus.textContent = 'Please fill in all fields';
            return;
        }
        
        // Show loading state
        showLoader();
        trackingStatus.textContent = 'Setting up price tracking...';
        
        try {
            // Changed endpoint name to avoid ad blockers
            const response = await fetch(`${API_URL}/catalog`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productUrl,
                    website,
                    targetPrice
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to start tracking');
            }
            
            // Update UI with the new product
            updateProductInUI(data);
            trackingStatus.textContent = `Successfully tracking product!`;
            
            // Clear form
            form.reset();
            
        } catch (error) {
            hideLoader();
            trackingStatus.textContent = `Error: ${error.message}`;
        }
    });
    
    // Check current price function
    async function checkCurrentPrice(trackerId) {
        if (!trackerId) return;
        
        trackingStatus.textContent = 'Checking current price...';
        
        try {
            const productElement = document.querySelector(`.tracked-product[data-id="${trackerId}"]`);
            if (productElement) {
                // Add loading indicator to the specific product
                const checkBtn = productElement.querySelector('.check-price-btn');
                const originalBtnText = checkBtn.textContent;
                checkBtn.innerHTML = '<span class="loader"></span> Checking...';
                checkBtn.disabled = true;
            }
            
            // Changed endpoint name to avoid ad blockers
            const response = await fetch(`${API_URL}/catalog/${trackerId}/check`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to check price');
            }
            
            // Update the specific product in UI
            updateProductInUI(data);
            trackingStatus.textContent = `Price check complete for ${data.productName || 'product'}!`;
            
        } catch (error) {
            trackingStatus.textContent = `Error checking price: ${error.message}`;
        } finally {
            // Restore button state if element still exists
            const checkBtn = document.querySelector(`.tracked-product[data-id="${trackerId}"] .check-price-btn`);
            if (checkBtn) {
                checkBtn.innerHTML = 'Check Current Price';
                checkBtn.disabled = false;
            }
        }
    }
    
    // Delete tracker function
    async function deleteTracker(trackerId) {
        if (!trackerId) return;
        
        if (!confirm('Are you sure you want to stop tracking this product?')) {
            return;
        }
        
        try {
            trackingStatus.textContent = 'Removing tracker...';
            
            // Add visual feedback
            const productElement = document.querySelector(`.tracked-product[data-id="${trackerId}"]`);
            if (productElement) {
                productElement.style.opacity = '0.5';
            }
            
            // Changed endpoint name to avoid ad blockers
            const response = await fetch(`${API_URL}/catalog/${trackerId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete tracker');
            }
            
            // Remove the product from UI
            if (productElement) {
                productElement.remove();
            }
            
            // Check if there are any products left
            if (productsContainer.children.length === 0) {
                showNoProducts();
            }
            
            trackingStatus.textContent = 'Product tracking removed successfully.';
            
        } catch (error) {
            // Restore opacity if deletion failed
            const productElement = document.querySelector(`.tracked-product[data-id="${trackerId}"]`);
            if (productElement) {
                productElement.style.opacity = '1';
            }
            
            trackingStatus.textContent = `Error: ${error.message}`;
        }
    }
    
    // Load all products when the page loads
    loadAllProducts();
});