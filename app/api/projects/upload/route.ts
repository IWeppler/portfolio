import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { uploadProjectImage } from "@/lib/supabase/project-storage";

const MAX_FILE_BYTES = 8 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "missing_file" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "invalid_file_type" }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "file_too_large" }, { status: 400 });
    }

    const url = await uploadProjectImage(file);

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("projects/upload: failed to upload image", error);

    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
