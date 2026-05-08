import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "business-assets";
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];

/**
 * POST /api/brand/logo
 * Accepts multipart/form-data with a "file" field.
 * Uploads to Supabase Storage bucket "business-assets" and returns the public URL.
 * Also updates businesses.brand_logo_url.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 2 MB)" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const ext = file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1];
    const path = `logos/${user.id}/logo.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const admin = createAdminClient();

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      // Bucket may not exist yet — return helpful message but don't crash
      console.error("[brand/logo] upload error:", uploadError.message);
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}. Ensure the "${BUCKET}" bucket exists in Supabase Storage.` },
        { status: 500 }
      );
    }

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    // Persist URL to businesses table
    await admin
      .from("businesses")
      .update({ brand_logo_url: publicUrl })
      .eq("owner_id", user.id);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("[brand/logo POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
