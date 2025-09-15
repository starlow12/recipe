/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // יוצר build עצמאי, מתאים ל-Cloudflare Pages
  reactStrictMode: true, // שמירה על מצב Strict של React
  experimental: {
    appDir: true // אם אתה משתמש בתיקיית /app של Next.js 13+
  }
}

module.exports = nextConfig
