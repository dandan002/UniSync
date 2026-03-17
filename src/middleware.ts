import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()
  const { pathname } = req.nextUrl

  // Unauthenticated user on a protected route → sign in
  if (!userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  // Authenticated user hitting /dashboard without completing onboarding → /onboarding
  // onboarding_completed is read from Clerk publicMetadata (no DB call needed on Edge)
  if (userId && pathname.startsWith('/dashboard')) {
    const meta = sessionClaims?.publicMetadata as Record<string, unknown> | undefined
    if (!meta?.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
