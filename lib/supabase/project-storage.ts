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
  const objectPath = `projects/${crypto.randomUUID()}.${extensionFromFile(file)}`;

  return uploadStorageObject(objectPath, file, file.type || "application/octet-stream");
}

/** Sube un archivo al bucket publico y devuelve su URL publica. */
export async function uploadStorageObject(
  objectPath: string,
  body: Blob | Uint8Array,
  contentType: string,
) {
  const { supabaseUrl, serviceRoleKey, bucket } = getSupabaseConfig();

  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": contentType,
        "x-upsert": "true",
        // El nombre es un uuid nuevo por subida, asi que el archivo es
        // inmutable y se puede cachear un ano (Supabase pone 1h por defecto).
        "cache-control": "max-age=31536000",
      },
      body: body as BodyInit,
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase Storage upload failed: ${response.status} ${message}`);
  }

  return storagePublicUrl(supabaseUrl, bucket, objectPath);
}

export async function deleteStorageObject(objectPath: string) {
  const { supabaseUrl, serviceRoleKey, bucket } = getSupabaseConfig();

  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`, {
    method: "DELETE",
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
  });

  if (!response.ok && response.status !== 404) {
    const message = await response.text();
    throw new Error(`Supabase Storage delete failed: ${response.status} ${message}`);
  }
}
