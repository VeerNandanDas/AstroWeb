import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Loader2, Plus, Trash2, Edit, X, ExternalLink } from "lucide-react";

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    featured_image: string;
    author: string;
    read_time: number;
    meta_description: string;
    published_at: string;
}

const BLOG_CATEGORIES = ["Astrology", "Gemstones", "Spirituality", "Wellness"];

export default function AdminBlogs() {
    const router = useRouter();
    const { user, isAdmin, loading } = useAuth();
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("Astrology");
    const [featuredImage, setFeaturedImage] = useState("");
    const [author, setAuthor] = useState("");
    const [readTime, setReadTime] = useState("5");
    const [metaDescription, setMetaDescription] = useState("");

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push("/");
        }
    }, [loading, isAdmin, router]);

    useEffect(() => {
        if (isAdmin && user) {
            setAuthor(user.email?.split("@")[0] || "Admin");
            fetchBlogs();
        }
    }, [isAdmin, user]);

    const fetchBlogs = async () => {
        try {
            setLoadingData(true);
            const { data, error } = await supabase
                .from("blog_posts")
                .select("*")
                .order("published_at", { ascending: false });

            if (error) throw error;
            setBlogs(data || []);
        } catch (error) {
            console.error("Error fetching blogs:", error);
        } finally {
            setLoadingData(false);
        }
    };

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    };

    const resetForm = () => {
        setTitle("");
        setSlug("");
        setExcerpt("");
        setContent("");
        setCategory("Astrology");
        setFeaturedImage("");
        setReadTime("5");
        setMetaDescription("");
        setEditingId(null);
    };

    const handleEdit = (blog: BlogPost) => {
        setEditingId(blog.id);
        setTitle(blog.title);
        setSlug(blog.slug);
        setExcerpt(blog.excerpt);
        setContent(blog.content);
        setCategory(blog.category);
        setFeaturedImage(blog.featured_image);
        setAuthor(blog.author);
        setReadTime(blog.read_time.toString());
        setMetaDescription(blog.meta_description);
        setShowForm(true);
    };

    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle);
        if (!editingId) {
            setSlug(generateSlug(newTitle));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !excerpt || !content || !featuredImage) {
            alert("Please fill in all required fields");
            return;
        }

        try {
            setIsSubmitting(true);

            const blogData = {
                title,
                slug: slug || generateSlug(title),
                excerpt,
                content,
                category,
                featured_image: featuredImage,
                author,
                read_time: parseInt(readTime),
                meta_description: metaDescription || excerpt,
                published_at: new Date().toISOString(),
            };

            if (editingId) {
                // Update existing blog
                const { error } = await supabase
                    .from("blog_posts")
                    .update(blogData)
                    .eq("id", editingId);

                if (error) throw error;

                setBlogs(prev =>
                    prev.map(b => b.id === editingId ? { ...b, ...blogData } : b)
                );
                alert("Blog post updated successfully!");
            } else {
                // Create new blog
                const { data, error } = await supabase
                    .from("blog_posts")
                    .insert([blogData])
                    .select()
                    .single();

                if (error) throw error;

                setBlogs(prev => [data, ...prev]);
                alert("Blog post published successfully!");
            }

            resetForm();
            setShowForm(false);
        } catch (error: any) {
            console.error("Error saving blog:", error);
            alert(`Failed to save blog post: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteBlog = async (id: string) => {
        if (!confirm("Are you sure you want to delete this blog post?")) {
            return;
        }

        try {
            setDeletingId(id);
            const { error } = await supabase
                .from("blog_posts")
                .delete()
                .eq("id", id);

            if (error) throw error;

            setBlogs(prev => prev.filter(b => b.id !== id));
            alert("Blog post deleted successfully!");
        } catch (error) {
            console.error("Error deleting blog:", error);
            alert("Failed to delete blog post");
        } finally {
            setDeletingId(null);
        }
    };

    if (loading || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Manage Blogs - Admin Dashboard</title>
            </Head>

            <div className="min-h-screen bg-background">
                {/* Header */}
                <div className="bg-primary text-primary-foreground py-8">
                    <div className="container mx-auto px-4 lg:px-8">
                        <Link href="/admin">
                            <Button variant="ghost" className="mb-4 text-primary-foreground hover:bg-primary-foreground/10">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Button>
                        </Link>
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="font-serif text-4xl font-bold mb-2">Blog Posts</h1>
                                <p className="text-primary-foreground/90">Manage blog articles</p>
                            </div>
                            <Button
                                onClick={() => {
                                    resetForm();
                                    setShowForm(!showForm);
                                }}
                                className="bg-accent text-accent-foreground hover:bg-accent/90"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                {showForm ? "Cancel" : "Write Blog"}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 lg:px-8 py-8">
                    {/* Add/Edit Blog Form */}
                    {showForm && (
                        <Card className="mb-8 border-primary/20">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>{editingId ? "Edit Blog Post" : "Write New Blog Post"}</CardTitle>
                                        <CardDescription>Create engaging content for your readers</CardDescription>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            resetForm();
                                            setShowForm(false);
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <Label htmlFor="title">Title *</Label>
                                        <Input
                                            id="title"
                                            value={title}
                                            onChange={(e) => handleTitleChange(e.target.value)}
                                            placeholder="Enter blog post title"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="slug">URL Slug *</Label>
                                            <Input
                                                id="slug"
                                                value={slug}
                                                onChange={(e) => setSlug(e.target.value)}
                                                placeholder="auto-generated-from-title"
                                                required
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Auto-generated from title, but you can customize it
                                            </p>
                                        </div>

                                        <div>
                                            <Label htmlFor="category">Category *</Label>
                                            <select
                                                id="category"
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                                required
                                            >
                                                {BLOG_CATEGORIES.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="excerpt">Excerpt *</Label>
                                        <Textarea
                                            id="excerpt"
                                            value={excerpt}
                                            onChange={(e) => setExcerpt(e.target.value)}
                                            placeholder="Brief summary of your blog post (1-2 sentences)"
                                            rows={2}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="content">Content *</Label>
                                        <Textarea
                                            id="content"
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            placeholder="Write your full blog post content here..."
                                            rows={12}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="featuredImage">Featured Image URL *</Label>
                                            <Input
                                                id="featuredImage"
                                                value={featuredImage}
                                                onChange={(e) => setFeaturedImage(e.target.value)}
                                                placeholder="https://example.com/image.jpg"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="readTime">Read Time (minutes) *</Label>
                                            <Input
                                                id="readTime"
                                                type="number"
                                                value={readTime}
                                                onChange={(e) => setReadTime(e.target.value)}
                                                placeholder="5"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="author">Author</Label>
                                        <Input
                                            id="author"
                                            value={author}
                                            onChange={(e) => setAuthor(e.target.value)}
                                            placeholder="Your name"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="metaDescription">SEO Meta Description</Label>
                                        <Textarea
                                            id="metaDescription"
                                            value={metaDescription}
                                            onChange={(e) => setMetaDescription(e.target.value)}
                                            placeholder="Optional - defaults to excerpt if not provided"
                                            rows={2}
                                        />
                                    </div>

                                    {featuredImage && (
                                        <div>
                                            <Label>Image Preview</Label>
                                            <div className="mt-2 rounded-lg overflow-hidden max-w-md">
                                                <img
                                                    src={featuredImage}
                                                    alt="Preview"
                                                    className="w-full h-auto"
                                                    onError={(e) => {
                                                        e.currentTarget.src = "https://via.placeholder.com/800x400?text=Invalid+Image+URL";
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>{editingId ? "Update Post" : "Publish Post"}</>
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                resetForm();
                                                setShowForm(false);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* Blogs List */}
                    {loadingData ? (
                        <div className="text-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                            <p className="mt-4 text-muted-foreground">Loading blog posts...</p>
                        </div>
                    ) : blogs.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground mb-4">No blog posts found</p>
                                <Button onClick={() => setShowForm(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Write Your First Post
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {blogs.map((blog) => (
                                <Card key={blog.id} className="hover-elevate transition-all">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-1">
                                            <img
                                                src={blog.featured_image}
                                                alt={blog.title}
                                                className="w-full h-48 md:h-full object-cover rounded-l-lg"
                                                onError={(e) => {
                                                    e.currentTarget.src = "https://via.placeholder.com/400x300?text=Blog";
                                                }}
                                            />
                                        </div>
                                        <div className="md:col-span-3 p-6">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant="outline">{blog.category}</Badge>
                                                        <span className="text-sm text-muted-foreground">
                                                            {blog.read_time} min read
                                                        </span>
                                                    </div>
                                                    <h3 className="font-serif text-xl font-bold mb-2">{blog.title}</h3>
                                                    <p className="text-sm text-muted-foreground mb-3">{blog.excerpt}</p>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span>By {blog.author}</span>
                                                        <span>•</span>
                                                        <span>{new Date(blog.published_at).toLocaleDateString()}</span>
                                                        <span>•</span>
                                                        <span className="font-mono">/{blog.slug}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(blog)}
                                                >
                                                    <Edit className="h-4 w-4 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => window.open(`/blog/${blog.slug}`, "_blank")}
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-1" />
                                                    View
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => deleteBlog(blog.id)}
                                                    disabled={deletingId === blog.id}
                                                >
                                                    {deletingId === blog.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Trash2 className="h-4 w-4 mr-1" />
                                                            Delete
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
