import { connection } from "next/server";
import { CURRENT_LGE, getLgeYear } from "@/lib/lge";

/** Current local election results, refreshed from the IEC at most once a minute. */
export async function GET() {
  await connection();
  const result = await getLgeYear(CURRENT_LGE);
  if (!result) return Response.json({ error: "No results available" }, { status: 503 });
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
