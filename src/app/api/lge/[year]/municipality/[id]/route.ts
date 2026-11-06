import { connection } from "next/server";
import { getMunicipality, isLgeYear } from "@/lib/lge";

/** Full results for one council: every party and every ward winner. */
export async function GET(_req: Request, ctx: RouteContext<"/api/lge/[year]/municipality/[id]">) {
  await connection();
  const { year, id } = await ctx.params;
  const y = Number(year);
  const m = Number(id);
  if (!isLgeYear(y) || !Number.isInteger(m)) return Response.json({ error: "Unknown election or council" }, { status: 404 });
  try {
    return Response.json(await getMunicipality(y, m));
  } catch {
    return Response.json({ error: "The IEC results feed could not be reached. Try again in a minute." }, { status: 502 });
  }
}
