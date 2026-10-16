import type { NextConfig } from "next";

// Las portadas que se suben desde el panel viven en Supabase Storage, asi que
// ese host tiene que estar habilitado para next/image.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

// Slugs genericos de la primera version (proyecto1..9). Se renombraron a
// nombres descriptivos; las URLs viejas redirigen para no perder lo indexado.
const RENAMED_PROJECT_SLUGS: Record<string, string> = {
  proyecto1: "el-nuevo-manantial",
  proyecto2: "inmobiliaria-terranova",
  proyecto3: "checancha",
  proyecto4: "club-atletico-tostado",
  proyecto5: "apex-bikes",
  proyecto6: "nivo-pos",
  proyecto7: "redditobooks",
  proyecto8: "inaqui-techos",
  proyecto9: "el-tolar-plataforma-agropecuaria",
};

const nextConfig: NextConfig = {
  async redirects() {
    return Object.entries(RENAMED_PROJECT_SLUGS).map(([from, to]) => ({
      source: `/:lang(es|en|pt)/projects/${from}`,
      destination: `/:lang/projects/${to}`,
      permanent: true,
    }));
  },
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
