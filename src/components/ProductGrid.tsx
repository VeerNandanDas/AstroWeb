import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@shared/schema";

interface ProductGridProps {
  category?: string;
  limit?: number;
}

export function ProductGrid({ category, limit }: ProductGridProps) {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: category ? ["/api/products", category] : ["/api/products"],
    queryFn: async () => {
      const url = category ? `/api/products?category=${category}` : "/api/products";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: limit || 8 }).map((_, i) => (
          <Card key={i} data-testid={`skeleton-product-${i}`}>
            <Skeleton className="h-64 w-full" />
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const displayProducts = limit ? products?.slice(0, limit) : products;

  if (!displayProducts || displayProducts.length === 0) {
    return (
      <div className="text-center py-12" data-testid="text-no-products">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {displayProducts.map((product) => (
        <Card
          key={product.id}
          className="overflow-hidden hover-elevate active-elevate-2 transition-all duration-300 group"
          data-testid={`card-product-${product.id}`}
        >
          <Link href={`/product/${product.id}`}>
            <div className="relative h-64 overflow-hidden bg-muted cursor-pointer">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                data-testid={`img-product-${product.id}`}
              />
              {product.certified && (
                <Badge className="absolute top-3 right-3 bg-accent/90 text-accent-foreground" data-testid={`badge-certified-${product.id}`}>
                  <Award className="h-3 w-3 mr-1" />
                  Certified
                </Badge>
              )}
            </div>
          </Link>

          <CardContent className="p-4 space-y-3">
            <div>
              <Badge variant="secondary" className="mb-2 text-xs" data-testid={`badge-category-${product.id}`}>
                {product.category}
              </Badge>
              <Link href={`/product/${product.id}`}>
                <h3 className="font-semibold text-base line-clamp-2 cursor-pointer hover:text-accent transition-colors" data-testid={`text-product-name-${product.id}`}>
                  {product.name}
                </h3>
              </Link>
            </div>

            <div className="flex items-center gap-1">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < Math.floor(Number(product.rating))
                      ? "text-accent fill-accent"
                      : "text-muted stroke-muted-foreground"
                      }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground" data-testid={`text-reviews-${product.id}`}>
                ({product.reviewCount})
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xl font-bold text-accent" data-testid={`text-price-${product.id}`}>
                ₹{Number(product.price).toLocaleString("en-IN")}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
