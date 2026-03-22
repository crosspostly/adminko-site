const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BLOG_DIR = path.join(__dirname, '../site/public/blog');
const BACKUP_DIR = path.join(__dirname, '../backups');

function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `blog-backup-${timestamp}`);
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    try {
        execSync(`cp -r "${BLOG_DIR}" "${backupPath}"`);
        console.log(`✅ Backup created: ${backupPath}`);
        const backups = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('blog-backup-')).map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime })).sort((a, b) => b.time - a.time);
        if (backups.length > 10) backups.slice(10).forEach(b => execSync(`rm -rf "${path.join(BACKUP_DIR, b.name)}"`));
    } catch (e) { console.error('Backup error:', e.message); }
}
if (require.main === module) createBackup();
module.exports = createBackup;
