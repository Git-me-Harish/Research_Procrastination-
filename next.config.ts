import type { NextConfig } from "next";

const FASTAPI_PORT = process.env.FASTAPI_PORT || "8001";
const FASTAPI_HOST = process.env.FASTAPI_HOST || "localhost";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,

  // ------------------------------------------------------------------
  // API Proxying — routes /api/v1/* to the Python FastAPI backend.
  //
  // This makes the app work on Windows WITHOUT needing Caddy:
  //   - On the sandbox/dev environment (with Caddy), the XTransformPort
  //     query parameter routes requests to FastAPI. The api.ts client
  //     appends ?XTransformPort=8001 to every request.
  //   - On Windows (without Caddy), these rewrites route /api/v1/* to
  //     http://localhost:8001 directly.
  //
  // Both approaches work. If you're on Windows and want to skip the
  // XTransformPort approach, you can edit src/lib/api.ts to remove the
  // XTransformPort suffix and rely solely on these rewrites.
  // ------------------------------------------------------------------
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `http://${FASTAPI_HOST}:${FASTAPI_PORT}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
