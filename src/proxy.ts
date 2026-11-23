import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Signed-in areas. Everything else (landing, onboarding, Sync) is public.
const isProtected = createRouteMatcher([
  "/home(.*)",
  "/jobs(.*)",
  "/resume(.*)",
  "/school(.*)",
  "/employer(.*)",
  "/welcome(.*)",
  "/register(.*)",
  "/api/reports(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next internals and static files unless they appear in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
