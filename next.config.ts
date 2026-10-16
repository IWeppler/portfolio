import type { NextConfig } from "next";

// Las portadas que se suben desde el panel viven en Supabase Storage, asi que
// ese host tiene que estar habilitado para next/image.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
    // Vercel cobra cada transformacion que no esta en cache, y la cache dura
    // max(minimumCacheTTL, max-age del origen). Supabase Storage sirve con
    // max-age=3600, asi que sin esto cada imagen se volvia a transformar cada
    // pocas horas. Las subidas tienen nombre unico (uuid): nunca cambian.
    minimumCacheTTL: 2678400, // 31 dias
    // Menos anchos posibles = menos variantes distintas por imagen.
    deviceSizes: [640, 828, 1080, 1920],
    imageSizes: [256, 384],
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https" as const,
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
