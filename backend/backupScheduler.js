const fs = require('fs');
const path = require('path');
const db = require('./db');

const BACKUP_DIR = path.resolve('./backups');
const MAX_BACKUPS = 10;
const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Ensure backup directory exists
function ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        console.log('[Backup] Created backups directory');
    }
}

// Create a timestamped backup using better-sqlite3's safe backup API
function createBackup() {
    ensureBackupDir();

    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const backupName = `database-${timestamp}.sqlite`;
    const backupPath = path.join(BACKUP_DIR, backupName);

    try {
        db.backup(backupPath)
            .then(() => {
                console.log(`[Backup] Created: ${backupName}`);
                cleanupOldBackups();
            })
            .catch(err => {
                console.error('[Backup] Failed:', err.message);
            });
    } catch (err) {
        console.error('[Backup] Error:', err.message);
    }
}

// Remove old backups, keeping only the latest MAX_BACKUPS
function cleanupOldBackups() {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('database-') && f.endsWith('.sqlite'))
            .sort()
            .reverse(); // newest first

        if (files.length > MAX_BACKUPS) {
            const toDelete = files.slice(MAX_BACKUPS);
            toDelete.forEach(file => {
                fs.unlinkSync(path.join(BACKUP_DIR, file));
                console.log(`[Backup] Cleaned up: ${file}`);
            });
        }
    } catch (err) {
        console.error('[Backup] Cleanup error:', err.message);
    }
}

// List available backups (newest first)
function listBackups() {
    ensureBackupDir();
    try {
        return fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('database-') && f.endsWith('.sqlite'))
            .sort()
            .reverse()
            .map(name => {
                const stat = fs.statSync(path.join(BACKUP_DIR, name));
                return {
                    name,
                    size: stat.size,
                    created: stat.mtime.toISOString()
                };
            });
    } catch {
        return [];
    }
}

// Get the path to the latest backup file
function getLatestBackupPath() {
    const backups = listBackups();
    if (backups.length === 0) return null;
    return path.join(BACKUP_DIR, backups[0].name);
}

// Start the daily backup scheduler
function startScheduler() {
    console.log('[Backup] Scheduler started (interval: 24h)');
    createBackup();
    setInterval(createBackup, INTERVAL_MS);
}

module.exports = { startScheduler, createBackup, listBackups, getLatestBackupPath, BACKUP_DIR };
