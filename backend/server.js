const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const backupRoutes = require('./routes/backup');
const { startScheduler } = require('./backupScheduler');

const app = express();
// Default to 3000 but allow environment variable override
const PORT = process.env.PORT || 3000;

// Middleware
// Enable CORS for all origins (can be restricted later if needed)
app.use(cors());
// Parse JSON payloads
app.use(express.json());

// Main API Routes
app.use('/auth', authRoutes);
app.use('/expenses', expenseRoutes);
app.use('/backup', backupRoutes);

// Health check endpoint
app.get('/', (req, res) => {
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
