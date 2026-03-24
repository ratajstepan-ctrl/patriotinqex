import { NextRequest, NextResponse } from "next/server";

const REMOTE_API_BASE = "https://api.patriotindex.cz";
const ALLOWED_RESOURCES = new Set(["politicians", "parties", "votes", "laws"]);

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ resource: string }> },
) {
  const { resource } = await context.params;

  if (!ALLOWED_RESOURCES.has(resource)) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  }

  try {
    const upstream = await fetch(`${REMOTE_API_BASE}/${resource}`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!upstream.ok) {
      const body = await upstream.text();
      return new NextResponse(body || "Upstream API error", {
        status: upstream.status,
        headers: {
          "content-type": upstream.headers.get("content-type") || "text/plain; charset=utf-8",
        },
      });
    }

    const data = await upstream.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch upstream API",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }
}
