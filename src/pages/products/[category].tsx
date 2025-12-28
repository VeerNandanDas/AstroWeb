import { useRouter } from "next/router";
import Head from "next/head";
import { ProductGrid } from "@/components/ProductGrid";

export default function ProductsCategory() {
  const router = useRouter();
  const { category } = router.query;

  const categoryTitles: Record<string, string> = {
    gemstones: "Premium Gemstones",
    bracelets: "Healing Crystal Bracelets",
    rudraksha: "Authentic Rudraksha Beads",
    yantras: "Sacred Yantras",
    rings: "Astrological Rings",
    remedies: "Spiritual Remedies"
  };

  const categoryDescriptions: Record<string, string> = {
    gemstones: "Certified natural gemstones carefully selected for their astrological properties and healing powers",
    bracelets: "Handcrafted crystal bracelets designed to balance your energy and promote well-being",
    rudraksha: "Sacred Rudraksha beads blessed and authenticated by expert astrologers",
    yantras: "Powerful geometric yantras energized for prosperity, protection, and spiritual growth",
    rings: "Exquisite gemstone rings crafted according to Vedic astrology principles",
    remedies: "Traditional spiritual remedies and products for specific planetary afflictions"
  };

  const categoryStr = typeof category === "string" ? category : "";
  const title = categoryTitles[categoryStr] || "All Products";
  const description = categoryDescriptions[categoryStr] || "Browse our collection of authentic spiritual products";

  return (
    <>
      <Head>
        <title>{title} - Divine Astrology</title>
      </Head>
      <div className="min-h-screen bg-background">
        <div className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              {title}
            </h1>
            <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto">
              {description}
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-12">
          <ProductGrid category={categoryStr} />
        </div>
      </div>
    </>
  );
}
