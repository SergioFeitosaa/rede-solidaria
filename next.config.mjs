/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Mantém os drivers de banco fora do bundle (PGlite carrega .wasm do disco).
  serverExternalPackages: ["@electric-sql/pglite", "pg"]
};

export default nextConfig;
