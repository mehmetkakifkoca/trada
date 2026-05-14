import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'default';
  const response = NextResponse.json({ success: true });
  
  // Clear the user-specific Google OAuth cookies
  response.cookies.set(`google_access_token_${userId}`, '', { expires: new Date(0), path: '/' });
  response.cookies.set(`google_refresh_token_${userId}`, '', { expires: new Date(0), path: '/' });
  
  return response;
}
