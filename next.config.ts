import type { NextConfig } from "next";

function supabaseHostname(): string | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return undefined;
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

const nextConfig: NextConfig = {
  images: {
    // Supabase Storage serves product/store images from the project hostname.
    // Allow the project host plus a wildcard fallback (`.supabase.co`) so
    // local/env-specific refs resolve without redeploying.
    remotePatterns: [
      ...(supabaseHostname()
        ? [{ protocol: "https" as const, hostname: supabaseHostname() as string }]
        : []),
      { protocol: "https", hostname: "*.supabase.co" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        // Security headers + Core Web Vitals friendly defaults on all routes.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
