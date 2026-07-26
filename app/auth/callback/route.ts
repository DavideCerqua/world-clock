import { NextResponse } from "next/server";
import { createClient } from "../../lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next") ?? "/";
  const safeNextPath = nextPath.startsWith("/") && !nextPath.startsWith("//")
    ? nextPath
    : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const forwardedProtocol = request.headers.get("x-forwarded-proto") ?? "https";
      const origin = forwardedHost
        ? `${forwardedProtocol}://${forwardedHost}`
        : requestUrl.origin;
      return NextResponse.redirect(`${origin}${safeNextPath}`);
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/?auth_error=oauth`);
}
