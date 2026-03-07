const express = require('express');
const router = express.Router();
const db = require('../db');

const ADMIN_CODE = '4424864';

router.post('/login', (req, res) => {
    const { code } = req.body;

    // First check if it's the admin code directly
    if (code === ADMIN_CODE) {
        return res.json({ success: true, isAdmin: true });
    }

    try {
        const pinRecord = db.prepare('SELECT * FROM pins WHERE pin = ?').get(code);
        if (pinRecord) {
            return res.json({ success: true, isAdmin: false });
        }
        return res.status(401).json({ success: false, message: 'Invalid code' });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/add-pin', (req, res) => {
    const { adminCode, newCode } = req.body;

    if (adminCode !== ADMIN_CODE) {
        console.log('Add PIN failed: Invalid admin code');
        return res.status(403).json({ success: false, message: 'Invalid admin code' });
    }

    console.log(`Adding PIN: ${newCode}`);

    if (!newCode || newCode.trim().length < 4) {
        return res.status(400).json({ success: false, message: 'New PIN must be at least 4 characters' });
    }

    try {
        // Check if PIN already exists
        const existingPin = db.prepare('SELECT * FROM pins WHERE pin = ?').get(newCode);
        if (existingPin) {
            return res.status(400).json({ success: false, message: 'This PIN already exists' });
        }

        db.prepare('INSERT INTO pins (pin) VALUES (?)').run(newCode);
        return res.json({ success: true, message: 'PIN added successfully' });
    } catch (err) {
        console.error('Failed to add PIN:', err);
        return res.status(500).json({ success: false, message: 'Failed to add PIN' });
    }
});

router.post('/delete-pin', (req, res) => {
    const { adminCode, targetCode } = req.body;
    console.log(`Delete PIN request for: ${targetCode} using Admin Code: ${adminCode}`);

    if (adminCode !== ADMIN_CODE) {
        console.log('Delete PIN failed: Invalid admin code');
        return res.status(403).json({ success: false, message: 'Invalid admin code' });
    }

    if (!targetCode) {
        console.log('Delete PIN failed: Target PIN is required');
        return res.status(400).json({ success: false, message: 'Target PIN is required' });
    }

    try {
        // Verify PIN exists
        const existingPin = db.prepare('SELECT * FROM pins WHERE pin = ?').get(targetCode);
        if (!existingPin) {
            console.log(`Delete PIN failed: PIN ${targetCode} not found`);
            return res.status(404).json({ success: false, message: 'PIN not found' });
        }

        // Delete all associated expenses first
        db.prepare('DELETE FROM expenses WHERE user_pin = ?').run(targetCode);

        // Then delete the PIN
        db.prepare('DELETE FROM pins WHERE pin = ?').run(targetCode);

        console.log(`Successfully deleted PIN and data for: ${targetCode}`);
        return res.json({ success: true, message: 'PIN and associated data deleted successfully' });
    } catch (err) {
        console.error('Failed to delete PIN:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete PIN' });
    }
});

module.exports = router;
