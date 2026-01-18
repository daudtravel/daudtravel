import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  matcher: "/((?!api|static|.*\\..*|_next).*)",
};