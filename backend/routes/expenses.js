const express = require('express');
const router = express.Router();
const db = require('../db');

// Add an expense
router.post('/', (req, res) => {
    const { date, amount, note } = req.body;
    const userPin = req.headers['x-user-pin'] || '123456'; // Default fallback just in case

    if (!date || amount === undefined) {
        return res.status(400).json({ error: 'Date and amount are required' });
    }

    try {
        const stmt = db.prepare('INSERT INTO expenses (date, amount, note, user_pin) VALUES (?, ?, ?, ?)');
        const info = stmt.run(date, amount, note || '', userPin);

        res.status(201).json({
            success: true,
            expense: { id: info.lastInsertRowid, date, amount, note, userPin }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add expense', details: err.message });
    }
});

// Get expenses (with optional date filtering)
router.get('/', (req, res) => {
    const { start, end } = req.query;
    const userPin = req.headers['x-user-pin'] || '123456';

    try {
        if (start && end) {
            const stmt = db.prepare('SELECT * FROM expenses WHERE user_pin = ? AND date >= ? AND date <= ? ORDER BY date DESC, id DESC');
            const expenses = stmt.all(userPin, start, end);
            return res.json(expenses);
        }

        // Default: return all expenses for this user ordered by date descending
        const stmt = db.prepare('SELECT * FROM expenses WHERE user_pin = ? ORDER BY date DESC, id DESC');
        const expenses = stmt.all(userPin);
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch expenses', details: err.message });
    }
});

// Update an expense
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { date, amount, note } = req.body;
    const userPin = req.headers['x-user-pin'] || '123456';

    try {
        const stmt = db.prepare('UPDATE expenses SET date = COALESCE(?, date), amount = COALESCE(?, amount), note = COALESCE(?, note) WHERE id = ? AND user_pin = ?');
        const info = stmt.run(date || null, amount !== undefined ? amount : null, note !== undefined ? note : null, id, userPin);

        if (info.changes === 0) {
            return res.status(404).json({ error: 'Expense not found or unauthorized' });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update expense', details: err.message });
    }
});

// Delete an expense
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const userPin = req.headers['x-user-pin'] || '123456';

    try {
        const stmt = db.prepare('DELETE FROM expenses WHERE id = ? AND user_pin = ?');
        const info = stmt.run(id, userPin);

        if (info.changes === 0) {
            return res.status(404).json({ error: 'Expense not found or unauthorized' });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete expense', details: err.message });
    }
});

module.exports = router;
