import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { google } from 'googleapis';
import cron from 'node-cron';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURATION ---
const BACKUP_DIR = path.join(__dirname, '../backups');
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const PG_URI = process.env.DATABASE_URL;
const MONGO_URI = process.env.MONGO_URI;

// Ensure backup dir exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// --- GOOGLE DRIVE AUTH ---
const getDriveClient = () => {
    let credentials;
    const credsEnv = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    if (!credsEnv) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is missing');
    }

    try {
        // Check if it's a JSON string
        credentials = JSON.parse(credsEnv);
    } catch (e) {
        // Assume it's a file path
        if (fs.existsSync(credsEnv)) {
            credentials = JSON.parse(fs.readFileSync(credsEnv, 'utf-8'));
        } else {
            throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON');
        }
    }

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    return google.drive({ version: 'v3', auth });
};

// --- BACKUP FUNCTIONS ---

const dumpPostgres = async (timestamp) => {
    if (!PG_URI) {
        console.log('⚠️ Skipping PostgreSQL Backup: DATABASE_URL not provided');
        return null;
    }
    const filename = `pg_dump_${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    console.log('🐘 Starting PostgreSQL Dump...');
    try {
        // Using pg_dump. Requires postgresql-client installed in Docker/System.
        await execAsync(`pg_dump "${PG_URI}" -f "${filepath}"`);
        console.log('✅ PostgreSQL Dump completed');
        return { filename, filepath };
    } catch (error) {
        console.error('❌ PostgreSQL Dump failed:', error.message);
        return null;
    }
};

const dumpMongo = async (timestamp) => {
    if (!MONGO_URI) {
        console.log('⚠️ Skipping MongoDB Backup: MONGO_URI not provided');
        return null;
    }
    const filename = `mongo_dump_${timestamp}.gz`;
    const filepath = path.join(BACKUP_DIR, filename);

    console.log('🍃 Starting MongoDB Dump...');
    try {
        // Using mongodump. Requires mongodb-database-tools installed.
        await execAsync(`mongodump --uri="${MONGO_URI}" --archive="${filepath}" --gzip`);
        console.log('✅ MongoDB Dump completed');
        return { filename, filepath };
    } catch (error) {
        console.error('❌ MongoDB Dump failed:', error.message);
        return null;
    }
};

const createZip = async (files, timestamp) => {
    return new Promise((resolve, reject) => {
        if (files.length === 0) return resolve(null);

        const zipName = `backup-${timestamp}.zip`;
        const zipPath = path.join(BACKUP_DIR, zipName);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`📦 Archive created: ${zipName} (${archive.pointer()} bytes)`);
            resolve({ zipName, zipPath });
        });

        archive.on('error', (err) => reject(err));

        archive.pipe(output);

        files.forEach(file => {
            if (file) {
                archive.file(file.filepath, { name: file.filename });
            }
        });

        archive.finalize();
    });
};

const uploadToDrive = async (zipData) => {
    if (!zipData || !DRIVE_FOLDER_ID) {
        console.log('⚠️ Skipping Upload: No zip file or GOOGLE_DRIVE_FOLDER_ID missing');
        return;
    }

    const drive = getDriveClient();
    const fileMetadata = {
        name: zipData.zipName,
        parents: [DRIVE_FOLDER_ID],
    };
    const media = {
        mimeType: 'application/zip',
        body: fs.createReadStream(zipData.zipPath),
    };

    console.log('☁️ Uploading to Google Drive...');
    const file = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id',
    });
    console.log(`✅ Upload successful. File ID: ${file.data.id}`);
};

const cleanup = (files, zipData) => {
    console.log('🧹 Cleaning up local files...');
    if (files) {
        files.forEach(f => {
            if (f && fs.existsSync(f.filepath)) fs.unlinkSync(f.filepath);
        });
    }
    if (zipData && fs.existsSync(zipData.zipPath)) {
        fs.unlinkSync(zipData.zipPath);
    }
    console.log('✨ Cleanup complete');
};

// --- MAIN PROCESS ---

export const performBackup = async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    console.log(`\n🕒 Starting Backup Routine: ${timestamp}`);

    try {
        const pgFile = await dumpPostgres(timestamp);
        const mongoFile = await dumpMongo(timestamp);

        const files = [pgFile, mongoFile].filter(f => f !== null);

        if (files.length > 0) {
            const zipData = await createZip(files, timestamp);
            await uploadToDrive(zipData);
            cleanup(files, zipData);
        } else {
            console.log('⚠️ No databases configured to backup.');
        }
    } catch (error) {
        console.error('❌ Backup Routine Error:', error);
    }
};

export const initBackupService = () => {
    // Schedule: 3:00 AM Daily
    cron.schedule('0 3 * * *', () => {
        performBackup();
    });
    console.log('🛡️ Backup Service Scheduled (3:00 AM Daily)');
};
