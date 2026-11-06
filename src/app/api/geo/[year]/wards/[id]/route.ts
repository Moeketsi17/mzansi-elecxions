import { connection } from "next/server";
import { getWardTopology } from "@/lib/geo";
import { isLgeYear } from "@/lib/lge";

/** Simplified ward boundaries (TopoJSON) for one council. */
export async function GET(_req: Request, ctx: RouteContext<"/api/geo/[year]/wards/[id]">) {
  await connection();
  const { year, id } = await ctx.params;
  const y = Number(year);
  const m = Number(id);
  if (!isLgeYear(y) || !Number.isInteger(m)) return Response.json({ error: "Unknown election or council" }, { status: 404 });
  try {
    return Response.json(await getWardTopology(y, m), {
      headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
    });
  } catch {
    return Response.json({ error: "Ward boundaries could not be loaded from the IEC. Try again shortly." }, { status: 502 });
  }
}
