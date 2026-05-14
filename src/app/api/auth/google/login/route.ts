import { NextResponse } from 'next/server';
import config from '@/config/google-calendar.json';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'default';
  
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  
  const options = {
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    state: userId, // Pass the Trada user ID to Google
    scope: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ].join(' '),
  };

  const qs = new URLSearchParams(options);
  
  return NextResponse.redirect(`${rootUrl}?${qs.toString()}`);
}
