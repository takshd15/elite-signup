import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/((?!_next|static|public|favicon.ico|robots.txt|sitemap.xml|assets|images|fonts).*)'],
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Allow requests for files (e.g., images), public assets, and the root path to pass through
  if (pathname === '/' || pathname.includes('.') || pathname.startsWith('/public/')) {
    return NextResponse.next();
  }
  // Redirect all other routes to the landing page
  return NextResponse.redirect(new URL('/', req.url));
}