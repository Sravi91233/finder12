
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: [
        "https://6000-firebase-studio-1752084764536.cluster-xpmcxs2fjnhg6xvn446ubtgpio.cloudworkstations.dev",
        "https://9000-firebase-studio-1752084764536.cluster-xpmcxs2fjnhg6xvn446ubtgpio.cloudworkstations.dev"
    ]
  }
};

export default nextConfig;
