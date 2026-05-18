import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { cookies } from 'next/headers';
import config from '@/config/google-calendar.json';

async function getPersonalAccessToken(userId: string) {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get(`google_access_token_${userId}`)?.value;
  const refreshToken = cookieStore.get(`google_refresh_token_${userId}`)?.value;

  if (!accessToken && refreshToken) {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: config.clientId,
          client_secret: config.clientSecret,
          grant_type: 'refresh_token',
        }),
      });
      const data = await response.json();
      if (data.access_token) accessToken = data.access_token;
    } catch (e) {}
  }
  return accessToken;
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';

    const { data } = await request.json();
    if (!data) {
      return NextResponse.json({ error: 'Keine Daten zum Sichern übergeben.' }, { status: 400 });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `trada-space-backup-${timestamp}.json`;

    const fileMetadata: any = {
      name: fileName,
      mimeType: 'application/json',
    };

    let drive;

    // 1. Try User's Personal Google Account OAuth first (Highly recommended, has full storage quota)
    const personalAccessToken = await getPersonalAccessToken(userId);
    if (personalAccessToken) {
      console.log(`[Trada Backup] Authenticating with user's personal Google Account for userId: ${userId}`);
      const oauth2Client = new google.auth.OAuth2(
        config.clientId,
        config.clientSecret,
        config.redirectUri
      );
      oauth2Client.setCredentials({ access_token: personalAccessToken });
      drive = google.drive({ version: 'v3', auth: oauth2Client });
    } else {
      // 2. Fallback to Service Account (Can fail on standard folders due to 0 quota restriction on new service accounts)
      console.log(`[Trada Backup] No personal Google connection found. Falling back to Google Service Account.`);
      const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (!clientEmail || !privateKey) {
        return NextResponse.json({ 
          error: 'Verbinden Sie zuerst Ihr Google-Konto im Kalender-Bereich, um Google Drive Backups zu aktivieren (Service Account Zugangsdaten fehlen).' 
        }, { status: 400 });
      }

      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });
      drive = google.drive({ version: 'v3', auth });
    }

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (folderId) {
      fileMetadata.parents = [folderId];
    }

    const jsonString = JSON.stringify(data, null, 2);
    const stream = Readable.from(Buffer.from(jsonString, 'utf-8'));

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: 'application/json',
        body: stream,
      },
      fields: 'id, name',
    });

    console.log(`Successfully uploaded backup! Google File ID: ${response.data.id}`);

    return NextResponse.json({ 
      success: true, 
      fileId: response.data.id,
      fileName: response.data.name,
      isPersonal: !!personalAccessToken
    });
  } catch (error: any) {
    console.error('Backup API Exception:', error);
    let errorMessage = error.message || 'Verbindung zu Google Drive fehlgeschlagen.';
    
    if (errorMessage.includes("storage quota")) {
      errorMessage = "Google Service Account hat kein Speicherkontingent. Bitte verbinden Sie Ihr persönliches Google-Konto im Kalender-Bereich mit Trada Space neu, um Backups direkt in Ihrem eigenen Drive zu speichern.";
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
