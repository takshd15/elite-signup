import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/((?!_next|static|public|favicon.ico|robots.txt|sitemap.xml|assets|images|fonts).*)'],
};

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === '/') return NextResponse.next();
  return NextResponse.redirect(new URL('/', req.url));
}