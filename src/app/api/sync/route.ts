import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const docRef = adminDb.collection('trada_app_data').doc('global_state');
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return NextResponse.json(docSnap.data());
    } else {
      return NextResponse.json(null);
    }
  } catch (error: any) {
    console.error('[Sync API GET Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data) {
      return NextResponse.json({ error: 'Keine Daten empfangen.' }, { status: 400 });
    }

    const docRef = adminDb.collection('trada_app_data').doc('global_state');
    
    // Save to Firestore using admin access (bypasses rules)
    await docRef.set(data);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Sync API POST Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
