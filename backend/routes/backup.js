const express = require('express');
const path = require('path');
const { listBackups, createBackup, getLatestBackupPath, BACKUP_DIR } = require('../backupScheduler');

const router = express.Router();
const ADMIN_CODE = '4424864';

// POST /backup?code=ADMIN_CODE
// Copy database.sqlite into /backups with timestamp name
router.post('/', (req, res) => {
    const { code } = req.query;

    if (code !== ADMIN_CODE) {
        return res.status(403).json({ success: false, message: 'Mã Admin không đúng' });
    }

    try {
        createBackup();
        res.json({ success: true, message: 'Backup đã được tạo' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi tạo backup' });
    }
});

// GET /backup/list?code=ADMIN_CODE
// Returns all available backup files
router.get('/list', (req, res) => {
    const { code } = req.query;

    if (code !== ADMIN_CODE) {
        return res.status(403).json({ success: false, message: 'Mã Admin không đúng' });
    }

    const backups = listBackups();
    res.json({ success: true, backups });
});

// GET /backup/download?code=ADMIN_CODE
// Downloads the latest backup file
router.get('/download', (req, res) => {
    const { code } = req.query;

    if (code !== ADMIN_CODE) {
        return res.status(403).json({ success: false, message: 'Mã Admin không đúng' });
    }

    const latestPath = getLatestBackupPath();

    if (!latestPath) {
        return res.status(404).json({ success: false, message: 'Chưa có bản backup nào' });
    }

    const fileName = path.basename(latestPath);
    res.download(latestPath, fileName, (err) => {
        if (err && !res.headersSent) {
            console.error('[Backup] Download error:', err.message);
            res.status(500).json({ success: false, message: 'Lỗi khi tải backup' });
        }
    });
});

module.exports = router;
