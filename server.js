const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize Express app
const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://beyond2048-frontend.onrender.com'
];

// Improved CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle favicon requests
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content response
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection with better error handling
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    // Don't exit the process immediately, give some time for logs to be written
    setTimeout(() => process.exit(1), 1000);
  });

// Mongoose connection event listeners for better monitoring
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error during runtime:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected! Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully');
});

// API Routes
app.use('/api', require('./routes/priceRoute'));

// Serve HTML file for root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`,
    status: 404
  });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(`[${new Date().toISOString()}] Error:`, err.stack);
  
  res.status(statusCode).json({
    message: err.message || 'Something went wrong!',
    status: statusCode,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    path: req.originalUrl
  });
});

// Graceful shutdown handling
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);

function shutDown() {
  console.log('Received kill signal, shutting down gracefully');
  
  // Close server first
  server.close(() => {
    console.log('Server closed');
    
    // Then close database connection
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
    
    // If closing MongoDB takes too long, force exit after 10 seconds
    setTimeout(() => {
      console.error('Could not close MongoDB connection in time, forcing shutdown');
      process.exit(1);
    }, 10000);
  });
}

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Set timeout limits if needed
server.timeout = 60000; // 60 seconds