import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { BlogPost } from "@shared/schema";

interface BlogSectionProps {
  limit?: number;
}

export function BlogSection({ limit }: BlogSectionProps) {
  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
    queryFn: async () => {
      const response = await fetch("/api/blog");
      if (!response.ok) throw new Error("Failed to fetch blog posts");
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: limit || 3 }).map((_, i) => (
          <Card key={i}>
            <Skeleton className="h-48 w-full" />
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const displayPosts = limit ? posts?.slice(0, limit) : posts;

  if (!displayPosts || displayPosts.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayPosts.map((post) => (
        <Link key={post.id} href={`/blog/${post.slug}`}>
          <Card className="overflow-hidden hover-elevate active-elevate-2 transition-all duration-300 cursor-pointer group h-full" data-testid={`card-blog-${post.id}`}>
            <div className="relative h-48 overflow-hidden bg-muted">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-xs" data-testid={`badge-category-${post.id}`}>
                  {post.category}
                </Badge>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.readTime} min read
                </span>
              </div>

              <h3 className="font-serif text-xl font-semibold line-clamp-2 group-hover:text-accent transition-colors" data-testid={`text-blog-title-${post.id}`}>
                {post.title}
              </h3>

              <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed" data-testid={`text-blog-excerpt-${post.id}`}>
                {post.excerpt}
              </p>

              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                <Calendar className="h-3 w-3" />
                <span>{new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
