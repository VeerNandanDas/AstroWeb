import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="description" content="Discover authentic gemstones, rudraksha, yantras and spiritual remedies with certified astrology consultations. Transform your life with ancient wisdom and premium spiritual products." />
        <meta property="og:title" content="VedicIntution - Premium Gemstones & Spiritual Guidance" />
        <meta property="og:description" content="Authentic spiritual products and expert astrology consultations for your well-being" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://astro-web-nine-pink.vercel.app/file.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://astro-web-nine-pink.vercel.app/file.png" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
