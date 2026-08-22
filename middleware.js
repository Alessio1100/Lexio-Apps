import { updateSession } from "./lib/supabase/middleware";

export async function middleware(request) {
  return await updateSession(request);
}

export const config = {
  // Protegge tutto tranne asset statici, immagini, service worker e le API
  // (le route API validano la sessione o il CRON_SECRET al loro interno).
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-.*\\.png).*)",
  ],
};
