import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const legacyGreekNewsPath = "/τα-νέα-μας";

function decodedPathname(pathname: string) {
  try { return decodeURIComponent(pathname); }
  catch { return pathname; }
}

export function proxy(request: NextRequest) {
  const pathname = decodedPathname(request.nextUrl.pathname);
  if (pathname === legacyGreekNewsPath || pathname.startsWith(`${legacyGreekNewsPath}/`)) {
    const suffix = pathname.slice(legacyGreekNewsPath.length);
    const destination = new URL(`/news${suffix}`, request.url);
    destination.search = request.nextUrl.search;
    return NextResponse.redirect(destination, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
