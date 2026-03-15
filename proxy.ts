import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define protected admin routes (everything else is public for booking)
const isProtectedRoute = createRouteMatcher([
    '/customers(.*)',
    '/packages(.*)',
    '/reservations(.*)',
    '/history(.*)',
    '/profile(.*)',
    '/settings(.*)',
    '/reports(.*)', 
    '/onboarding(.*)',
    '/dev(.*)',
    '/' // Dashboard home
])

export default clerkMiddleware(async (auth, request) => {
    if (isProtectedRoute(request)) {
        await auth.protect()
    }
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}