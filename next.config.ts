import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Habilitar Turbopack para desenvolvimento mais rápido
  turbo: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Configurações experimentais do Next.js 15
  experimental: {
    // Habilitar React Compiler (se disponível)
    reactCompiler: true,
    // Otimizações de bundle
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
    ],
  },

  // Configurações de imagem
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Configurações de TypeScript
  typescript: {
    // Ignorar erros de tipo durante o build (apenas para desenvolvimento)
    ignoreBuildErrors: false,
  },

  // Configurações de ESLint
  eslint: {
    // Ignorar erros de ESLint durante o build (apenas para desenvolvimento)
    ignoreDuringBuilds: false,
  },

  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
