import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await req.body?.cancel();
  return NextResponse.json(
    { error: "This invite endpoint has been retired. Use /api/team/invite." },
    { status: 410 }
  );
}
