import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  allowedDevOrigins: ["zotes.local"],
  async headers() {
    return [
      {
        // Keep the unlisted share page out of search engines even if a
        // crawler ignores the page-level robots metadata.
        source: "/share/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

export default nextConfig;
