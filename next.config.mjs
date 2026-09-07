/** @type {import('next').NextConfig} */
const nextConfig = {
  // Shared hosting caps memory well below what parallel build workers need.
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
};

export default nextConfig;
