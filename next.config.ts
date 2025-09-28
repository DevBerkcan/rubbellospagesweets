// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // WICHTIG für STRATO (statisches Hosting)
  //output: 'export',
  // Optional: hilfreich für statische Hosts ohne Rewrites
  //trailingSlash: true,

  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
    // Für Static Export MUSS das unoptimized sein, wenn du <Image> nutzt
    unoptimized: true
  },

  // Achtung: Alles hier unter "env" ist im Browser öffentlich sichtbar!
  // Packe nur Public-Variablen hier rein (NEXT_PUBLIC_*).
  env: {
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
    NEXT_PUBLIC_TIKTOK_PIXEL_ID: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID,

    // ❌ MAILCHIMP_API_KEY NIEMALS client-seitig exponieren!
    // Entferne die beiden untenstehenden Zeilen aus next.config.js:
    // MAILCHIMP_API_KEY: process.env.MAILCHIMP_API_KEY,
    // MAILCHIMP_LIST_ID: process.env.MAILCHIMP_LIST_ID,
  },
};

module.exports = nextConfig;
