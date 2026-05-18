import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import { google } from 'googleapis';

// 1. Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}
const db = admin.firestore();

const BACKUP_DIR = path.resolve(process.cwd(), 'backups');
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID; // Can be set if a specific folder is needed

async function exportFirestore() {
  console.log('Starting Firestore backup...');
  const collections = await db.listCollections();
  const dbData: Record<string, any> = {};

  for (const collection of collections) {
    console.log(`Exporting collection: ${collection.id}`);
    const snapshot = await collection.get();
    dbData[collection.id] = {};
    
    snapshot.forEach(doc => {
      dbData[collection.id][doc.id] = doc.data();
    });
  }

  return dbData;
}

async function createZipArchive(dbData: any, filePath: string): Promise<void> {
  console.log(`Creating zip archive at: ${filePath}`);
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(filePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`Archive created successfully. Total bytes: ${archive.pointer()}`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    
    // Add the DB data as a JSON file inside the zip
    archive.append(JSON.stringify(dbData, null, 2), { name: 'firestore_backup.json' });
    
    archive.finalize();
  });
}

async function uploadToGoogleDrive(filePath: string, fileName: string) {
  console.log('Authenticating with Google Drive...');
  
  // Requires GOOGLE_APPLICATION_CREDENTIALS environment variable or pass explicit keys
  // Assuming a service account JSON is provided or variables are set:
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  const drive = google.drive({ version: 'v3', auth });

  console.log(`Uploading ${fileName} to Google Drive...`);
  
  const fileMetadata: any = {
    name: fileName,
  };
  
  if (GOOGLE_DRIVE_FOLDER_ID) {
    fileMetadata.parents = [GOOGLE_DRIVE_FOLDER_ID];
  }

  const media = {
    mimeType: 'application/zip',
    body: fs.createReadStream(filePath),
  };

  try {
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });
    console.log(`File uploaded successfully with ID: ${response.data.id}`);
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
}

async function runBackup() {
  try {
    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFileName = `backup-${timestamp}.zip`;
    const zipFilePath = path.join(BACKUP_DIR, zipFileName);

    // 1. Fetch Data
    const data = await exportFirestore();

    // 2. Create Zip
    await createZipArchive(data, zipFilePath);

    // 3. Upload to Google Drive
    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      await uploadToGoogleDrive(zipFilePath, zipFileName);
      console.log('Backup process completed successfully.');
    } else {
      console.warn('Google Drive credentials not found in .env.local. Skipping upload.');
      console.log(`Local backup saved at: ${zipFilePath}`);
    }

  } catch (error) {
    console.error('Backup process failed:', error);
    process.exit(1);
  }
}

// Execute the backup
runBackup();
