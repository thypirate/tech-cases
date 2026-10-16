import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image.
  output: 'standalone',
  // Monorepo root, so standalone tracing picks up dependencies hoisted outside apps/web.
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
