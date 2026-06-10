import { NextResponse, NextRequest } from 'next/server';
import { getToken, type JWT } from 'next-auth/jwt';

export default async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const token: JWT | null = await getToken({ req });


  // Restrict access to /dashboard and its subroutes if not authenticated
  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  if (pathname.startsWith('/dashboard') && token) {
    const role = (token as JWT & { role?: string }).role;
    if (role === 'Employee') {
      if (pathname === '/dashboard') {
        return NextResponse.redirect(new URL('/dashboard/attendance', req.url));
      }

      const employeeAllowedRoutes = new Set([
        '/dashboard/attendance',
        '/dashboard/payroll',
        '/dashboard/performance',
      ]);

      if (!employeeAllowedRoutes.has(pathname)) {
        return NextResponse.redirect(new URL('/dashboard/attendance', req.url));
      }
    }
  }

  return NextResponse.next();
}

// Apply middleware only to protected routes
export const config = {
  matcher: ['/dashboard/:path*'], // Protects all /dashboard routes
};
