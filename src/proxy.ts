import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const session = request.cookies.get('__session')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  
  // Note: True session validation happens on the client and in secure server actions.
  // This middleware is a first-pass check to improve UX by preventing flicker.
  
  if (!session && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
