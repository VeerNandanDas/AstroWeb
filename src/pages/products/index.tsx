import Head from "next/head";
import { ProductGrid } from "@/components/ProductGrid";

export default function Products() {
  return (
    <>
      <Head>
        <title>All Products - Divine Astrology</title>
      </Head>
      <div className="min-h-screen bg-background">
        <div className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              All Products
            </h1>
            <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto">
              Explore our complete collection of authentic spiritual products and gemstones carefully curated for your well-being
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-12">
          <ProductGrid />
        </div>
      </div>
    </>
  );
}
