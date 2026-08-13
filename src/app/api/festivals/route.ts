import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getFestivalHolidays } from "@/lib/festivals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const year = Number(searchParams.get("year") || new Date().getFullYear());
  const country = searchParams.get("country") || "IN";

  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  try {
    const festivals = await getFestivalHolidays(year, country);
    return NextResponse.json({ festivals });
  } catch (error) {
    console.error("[Festivals API Error]:", error);
    return NextResponse.json(
      { error: "Could not load festivals" },
      { status: 500 }
    );
  }
}
