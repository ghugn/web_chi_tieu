const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const backupRoutes = require('./routes/backup');
const { startScheduler } = require('./backupScheduler');

const app = express();
// Default to 3000 but allow environment variable override
const PORT = process.env.PORT || 3000;

// Performance Middleware
// Enable GZIP/Brotli compression
app.use(compression());
// Log request duration ( Morgan :method :url :status :response-time ms )
app.use(morgan('dev'));
// Enable CORS
app.use(cors());
// Parse JSON payloads with a strict limit for security/performance
app.use(express.json({ limit: '1mb' }));

// Main API Routes
app.use('/auth', authRoutes);
app.use('/expenses', expenseRoutes);
app.use('/backup', backupRoutes);

// Health check endpoint
app.get('/', (req, res) => {
    // Add caching headers for the health check (300 seconds)
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json({
        status: 'ok',
        service: 'Expense Tracker API',
        uptime: process.uptime()
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running minimal backend on port ${PORT}`);
    // Start daily backup scheduler
    startScheduler();
});
