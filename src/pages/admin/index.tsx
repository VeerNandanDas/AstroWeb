import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    Calendar,
    Package,
    Video,
    FileText,
    Star,
    ShoppingCart,
    TrendingUp,
    DollarSign,
    ArrowLeft,
    XCircle,
    Clock,
    Moon,
    CheckCircle,
    Sunrise
} from "lucide-react";

interface Stats {
    totalAppointments: number;
    pendingAppointments: number;
    totalProducts: number;
    totalVideos: number;
    totalBlogs: number;
    totalTestimonials: number;
    totalOrders: number;
    pendingOrders: number;
}

export default function AdminDashboard() {
    const router = useRouter();
    const { user, isAdmin, loading } = useAuth();
    const [stats, setStats] = useState<Stats>({
        totalAppointments: 0,
        pendingAppointments: 0,
        totalProducts: 0,
        totalVideos: 0,
        totalBlogs: 0,
        totalTestimonials: 0,
        totalOrders: 0,
        pendingOrders: 0,
    });
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push("/");
        }
    }, [loading, isAdmin, router]);

    useEffect(() => {
        if (isAdmin) {
            fetchStats();
        }
    }, [isAdmin]);

    const fetchStats = async () => {
        try {
            setLoadingStats(true);

            // Fetch appointments
            const { count: totalAppointments } = await supabase
                .from("appointments")
                .select("*", { count: "exact", head: true });

            const { count: pendingAppointments } = await supabase
                .from("appointments")
                .select("*", { count: "exact", head: true })
                .eq("status", "pending");

            // Fetch products
            const { count: totalProducts } = await supabase
                .from("products")
                .select("*", { count: "exact", head: true });

            // Fetch videos
            const { count: totalVideos } = await supabase
                .from("videos")
                .select("*", { count: "exact", head: true });

            // Fetch blog posts
            const { count: totalBlogs } = await supabase
                .from("blog_posts")
                .select("*", { count: "exact", head: true });

            // Fetch testimonials
            const { count: totalTestimonials } = await supabase
                .from("testimonials")
                .select("*", { count: "exact", head: true });

            // Fetch orders
            const { count: totalOrders } = await supabase
                .from("orders")
                .select("*", { count: "exact", head: true });

            const { count: pendingOrders } = await supabase
                .from("orders")
                .select("*", { count: "exact", head: true })
                .eq("payment_status", "pending");

            setStats({
                totalAppointments: totalAppointments || 0,
                pendingAppointments: pendingAppointments || 0,
                totalProducts: totalProducts || 0,
                totalVideos: totalVideos || 0,
                totalBlogs: totalBlogs || 0,
                totalTestimonials: totalTestimonials || 0,
                totalOrders: totalOrders || 0,
                pendingOrders: pendingOrders || 0,
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoadingStats(false);
        }
    };

    if (loading || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    const adminSections = [
        {
            title: "Panchang",
            description: "Manage daily panchang details",
            icon: Clock,
            href: "/admin/panchang",
            count: 0,
            color: "from-blue-500 to-cyan-500",
        },
        {
            title: "Products",
            description: "Manage product catalog",
            icon: Package,
            href: "/admin/products",
            count: stats.totalProducts,
            color: "from-purple-500 to-pink-500",
        },
        {
            title: "Videos",
            description: "Manage video content",
            icon: Video,
            href: "/admin/videos",
            count: stats.totalVideos,
            color: "from-red-500 to-orange-500",
        },
        {
            title: "Blog Posts",
            description: "Manage blog articles",
            icon: FileText,
            href: "/admin/blogs",
            count: stats.totalBlogs,
            color: "from-green-500 to-emerald-500",
        },
        {
            title: "Daily Horoscope",
            description: "Manage daily zodiac predictions",
            icon: Moon,
            href: "/admin/horoscopes",
            count: stats.totalTestimonials, // Keeping count for layout
            color: "from-indigo-500 to-violet-500",
        },
        {
            title: "Muhurat",
            description: "Manage auspicious timings",
            icon: Sunrise,
            href: "/admin/muhurat",
            count: 0, // Will be updated when we fetch muhurat count
            color: "from-amber-500 to-yellow-500",
        },
    ];

    return (
        <>
            <Head>
                <title>Admin Dashboard - Divine Astrology</title>
            </Head>

            <div className="min-h-screen bg-background">
                {/* Header */}
                <div className="bg-primary text-primary-foreground py-8">
                    <div className="container mx-auto px-4 lg:px-8">
                        <Link href="/">
                            <Button variant="ghost" className="mb-4 text-primary-foreground hover:bg-primary-foreground/10">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Website
                            </Button>
                        </Link>
                        <h1 className="font-serif text-4xl font-bold mb-2">Admin Dashboard</h1>
                        <p className="text-primary-foreground/90">Welcome back, {user?.email}</p>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="container mx-auto px-4 lg:px-8 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Panchang Updates</p>
                                        <p className="text-3xl font-bold text-blue-600">Daily</p>
                                        <Badge variant="secondary" className="mt-2 bg-blue-100 text-blue-800">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Active
                                        </Badge>
                                    </div>
                                    <Clock className="h-12 w-12 text-blue-500 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Total Products</p>
                                        <p className="text-3xl font-bold text-purple-600">{stats.totalProducts}</p>
                                    </div>
                                    <Package className="h-12 w-12 text-purple-500 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                                        <p className="text-3xl font-bold text-green-600">{stats.totalOrders}</p>
                                        {stats.pendingOrders > 0 && (
                                            <Badge variant="secondary" className="mt-2 bg-yellow-100 text-yellow-800">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {stats.pendingOrders} pending
                                            </Badge>
                                        )}
                                    </div>
                                    <ShoppingCart className="h-12 w-12 text-green-500 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Content Items</p>
                                        <p className="text-3xl font-bold text-orange-600">
                                            {stats.totalVideos + stats.totalBlogs + stats.totalTestimonials}
                                        </p>
                                    </div>
                                    <TrendingUp className="h-12 w-12 text-orange-500 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Admin Sections */}
                    <div className="mb-8">
                        <h2 className="font-serif text-2xl font-bold mb-6">Manage Content</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {adminSections.map((section, index) => (
                                <Link key={index} href={section.href}>
                                    <Card className="hover-elevate active-elevate-2 transition-all duration-300 cursor-pointer group h-full">
                                        <CardHeader>
                                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                                <section.icon className="h-6 w-6 text-white" />
                                            </div>
                                            <CardTitle className="flex items-center justify-between">
                                                {section.title}
                                                <Badge variant="secondary">{section.count}</Badge>
                                            </CardTitle>
                                            <CardDescription>{section.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center gap-2 text-sm text-green-600">
                                                <CheckCircle className="h-4 w-4" />
                                                All up to date
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <h2 className="font-serif text-2xl font-bold mb-6">Quick Actions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Link href="/admin/panchang">
                                <Button className="w-full" size="lg">
                                    <Clock className="h-4 w-4 mr-2" />
                                    Manage Panchang
                                </Button>
                            </Link>
                            <Link href="/admin/products">
                                <Button className="w-full" size="lg" variant="outline">
                                    <Package className="h-4 w-4 mr-2" />
                                    Manage Products
                                </Button>
                            </Link>
                            <Link href="/admin/blogs">
                                <Button className="w-full" size="lg" variant="outline">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Manage Blogs
                                </Button>
                            </Link>
                            <Link href="/admin/videos">
                                <Button className="w-full" size="lg" variant="outline">
                                    <Video className="h-4 w-4 mr-2" />
                                    Manage Videos
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
