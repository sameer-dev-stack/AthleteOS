import { NextRequest, NextResponse } from "next/server";

// Self-host PostHog's static assets (surveys.js, dead-clicks-autocapture.js,
// web-vitals.js, config.js) through our own origin. PostHog's CDN stamps these
// with a short 4h / 5m Cache-Control; by fetching them server-side and
// re-serving with a long immutable TTL we control repeat-visit caching.
//
// The PostHog client is configured with `ui_host: "/proxy/posthog"` so its lazy
// chunks resolve to `/proxy/posthog/static/<name>.js?v=1.396.6`, which maps to
// this handler. Asset filenames are versioned (?v=1.396.6) and never change
// without a bumped version, so `immutable` is safe.
const POSTHOG_ASSET_HOST = "https://us-assets.i.posthog.com";

export const dynamic = "force-static";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const assetPath = path.join("/");
  const search = request.nextUrl.search;
  const upstream = `${POSTHOG_ASSET_HOST}/${assetPath}${search}`;

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstream, { cache: "no-store" });
  } catch {
    return new NextResponse("Failed to load PostHog asset", { status: 502 });
  }

  if (!upstreamRes.ok) {
    return new NextResponse("Not found", { status: upstreamRes.status });
  }

  const body = await upstreamRes.arrayBuffer();
  const contentType =
    upstreamRes.headers.get("content-type") || "application/javascript";

  const res = new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // Override the CDN's short TTL with a long immutable one.
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
  return res;
}
