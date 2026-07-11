/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fissa il root del progetto: nella home dell'utente esiste un altro
  // package-lock.json che altrimenti confonde Next (e il tracing su Vercel).
  outputFileTracingRoot: import.meta.dirname,
  images: {
    // Vercel Blob serve gli audio; per eventuali immagini remote su blob
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
