import { NextResponse } from "next/server";

const REMOTE_API_BASE = "https://api.patriotindex.cz";
const RESOURCES = ["politicians", "parties", "votes", "laws"] as const;

export async function GET() {
  const results = await Promise.all(
    RESOURCES.map(async (resource) => {
      try {
        const res = await fetch(`${REMOTE_API_BASE}/${resource}`, {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        const text = await res.text();
        let parsed: unknown = null;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch {
          parsed = null;
        }

        return {
          resource,
          status: res.status,
          ok: res.ok,
          sample:
            Array.isArray(parsed) && parsed.length > 0
              ? parsed[0]
              : typeof parsed === "object" && parsed !== null
              ? parsed
              : text.slice(0, 200),
        };
      } catch (error) {
        return {
          resource,
          status: 0,
          ok: false,
          sample: {
            error: "Request failed",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        };
      }
    }),
  );

  const allOk = results.every((r) => r.ok);
  return NextResponse.json(
    {
      ok: allOk,
      checkedAt: new Date().toISOString(),
      results,
    },
    { status: allOk ? 200 : 502 },
  );
}
