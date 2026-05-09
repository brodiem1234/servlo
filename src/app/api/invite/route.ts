import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await req.json().catch(() => null);
  return NextResponse.json(
    { error: "This invite endpoint has been retired. Use /api/team/invite." },
    { status: 410 }
  );
}
