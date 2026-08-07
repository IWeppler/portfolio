function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_PROJECTS_BUCKET || "project-images";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase project admin environment variables");
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ""),
    serviceRoleKey,
    bucket,
  };
}

export { supabaseRest } from "./rest";

function storagePublicUrl(supabaseUrl: string, bucket: string, objectPath: string) {
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

function extensionFromFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension && /^[a-z0-9]+$/.test(extension)) {
    return extension;
  }

  return file.type.split("/")[1] || "webp";
}

export async function uploadProjectImage(file: File) {
  const { supabaseUrl, serviceRoleKey, bucket } = getSupabaseConfig();
  const extension = extensionFromFile(file);
  const objectPath = `projects/${crypto.randomUUID()}.${extension}`;

  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: file,
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase Storage upload failed: ${response.status} ${message}`);
  }

  return storagePublicUrl(supabaseUrl, bucket, objectPath);
}
