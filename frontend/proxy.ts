import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_PATHS = ['/login', '/signup']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('pop_token')?.value

  // Already authenticated → send away from auth pages
  if (AUTH_PATHS.some(p => pathname.startsWith(p)) && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Not authenticated → protect dashboard routes
  const isPublic = AUTH_PATHS.some(p => pathname.startsWith(p)) || pathname === '/'
  if (!isPublic && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
