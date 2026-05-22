import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  const { pathname } = url

  const isTeacherDomain = hostname === 'teacher.iblearning.space' || hostname.startsWith('teacher.')
  const isStudentDomain = hostname === 'iblearning.space' || hostname === 'www.iblearning.space'

  // Skip API and socket routes
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  if (isTeacherDomain) {
    // teacher.iblearning.space → all traffic is teacher
    // If someone hits / on the teacher domain, redirect to /teacher
    if (pathname === '/') {
      url.pathname = '/teacher'
      return NextResponse.redirect(url)
    }
    // If they try to go to /student on teacher domain, redirect them out
    if (pathname.startsWith('/student')) {
      url.host = isStudentDomain ? hostname : 'iblearning.space'
      url.pathname = '/student'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  if (isStudentDomain) {
    // iblearning.space → all traffic is student
    if (pathname === '/') {
      url.pathname = '/student'
      return NextResponse.redirect(url)
    }
    // Block teacher routes on student domain
    if (pathname.startsWith('/teacher')) {
      url.pathname = '/student'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // localhost / preview — no redirect, serve everything
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
