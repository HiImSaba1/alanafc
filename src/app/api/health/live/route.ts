export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { status: "ok", service: "alanafc-web" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
