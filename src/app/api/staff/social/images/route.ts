import { NextResponse } from "next/server";
import { requireStaffUser, createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const BUCKET = "social-images";

export async function GET() {
  const auth = await requireStaffUser();
  if (auth instanceof NextResponse) return auth;

  const supabase = createServiceClient();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list("social", {
      limit: 200,
      sortBy: { column: "created_at", order: "desc" },
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const images = (data ?? [])
    .filter(f => !f.id.endsWith("/") && f.name !== ".emptyFolderPlaceholder")
    .map(f => {
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(`social/${f.name}`);
      return {
        url: publicUrl,
        name: f.name,
        created_at: f.created_at,
      };
    });

  return NextResponse.json({ images });
}
